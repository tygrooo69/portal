import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'storage.json');

// --- MySQL Configuration ---
const useMySQL = !!(process.env.MYSQL_HOST && process.env.MYSQL_DATABASE);

let pool = null;

if (useMySQL) {
  console.log(`🐬 Mode MySQL activé sur ${process.env.MYSQL_HOST} (DB: ${process.env.MYSQL_DATABASE})`);
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true 
  });
  
  // Initialize Tables
  initDB().catch(err => {
    console.error("FATAL: Failed to initialize database tables.", err);
    process.exit(1);
  });
} else {
  console.log("📂 Mode Fichier Local activé (storage.json)");
  (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) { /* ignore */ }
  })();
}

async function initDB() {
  if (!pool) return;
  const conn = await pool.getConnection();
  try {
    console.log("Checking database schema...");
    
    // Users Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        password VARCHAR(255),
        avatar TEXT,
        color VARCHAR(50),
        role VARCHAR(20) DEFAULT 'user',
        service VARCHAR(100),
        employeeCode VARCHAR(50),
        jobTitle VARCHAR(100),
        secteur VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Projects Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        color VARCHAR(50),
        status VARCHAR(50),
        priority VARCHAR(50),
        startDate VARCHAR(50),
        endDate VARCHAR(50),
        createdAt VARCHAR(50),
        members TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Tasks Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        projectId VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        status VARCHAR(50),
        priority VARCHAR(50),
        startDate VARCHAR(50),
        endDate VARCHAR(50),
        assignee VARCHAR(255),
        subtasks LONGTEXT,
        dependencies LONGTEXT,
        INDEX idx_project (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Comments Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(255) PRIMARY KEY,
        taskId VARCHAR(255),
        userId VARCHAR(255),
        text TEXT,
        createdAt VARCHAR(50),
        INDEX idx_task (taskId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Notifications Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255),
        type VARCHAR(50),
        message TEXT,
        isRead BOOLEAN,
        createdAt VARCHAR(50),
        linkProjectId VARCHAR(255),
        linkTaskId VARCHAR(255),
        INDEX idx_user (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Timesheets Table (Updated with managerId, isProcessed, type, interimName, attachments)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255),
        managerId VARCHAR(255),
        weekStartDate VARCHAR(20),
        status VARCHAR(20),
        entries LONGTEXT,
        rejectionReason TEXT,
        submittedAt VARCHAR(50),
        isProcessed BOOLEAN DEFAULT FALSE,
        type VARCHAR(20) DEFAULT 'standard',
        interimName VARCHAR(255),
        attachments LONGTEXT,
        INDEX idx_user_week (userId, weekStartDate),
        INDEX idx_manager (managerId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Leave Requests Table (Updated with managerId and isProcessed)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255),
        managerId VARCHAR(255),
        type VARCHAR(20),
        startDate VARCHAR(50),
        endDate VARCHAR(50),
        halfDay VARCHAR(20),
        reason TEXT,
        status VARCHAR(20),
        rejectionReason TEXT,
        createdAt VARCHAR(50),
        isProcessed BOOLEAN DEFAULT FALSE,
        INDEX idx_user_leave (userId),
        INDEX idx_manager_leave (managerId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Apps Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS apps (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        icon VARCHAR(100),
        color VARCHAR(50),
        category VARCHAR(50),
        url TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Documents Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(50),
        uploadDate VARCHAR(50),
        content LONGTEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Settings Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        apiKey TEXT,
        adminPassword TEXT,
        logo LONGTEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      INSERT IGNORE INTO settings (id, apiKey, adminPassword, logo) VALUES (1, '', 'admin', '');
    `);

    console.log("✅ Database schema initialized.");
  } finally {
    conn.release();
  }
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'dist')));

const getDefaultData = () => ({ 
  apps: [], 
  documents: [], 
  projects: [],
  tasks: [],
  users: [],
  comments: [],
  notifications: [],
  timesheets: [],
  leaveRequests: [],
  apiKey: "", 
  adminPassword: "admin",
  logo: ""
});

// --- Routes ---

app.get('/api/data', async (req, res) => {
  if (useMySQL && pool) {
    try {
      const [projectsRows] = await pool.query('SELECT * FROM projects');
      const [tasksRows] = await pool.query('SELECT * FROM tasks');
      const [apps] = await pool.query('SELECT * FROM apps');
      const [documents] = await pool.query('SELECT * FROM documents');
      const [users] = await pool.query('SELECT * FROM users');
      const [comments] = await pool.query('SELECT * FROM comments');
      const [notificationsRows] = await pool.query('SELECT * FROM notifications');
      const [timesheetsRows] = await pool.query('SELECT * FROM timesheets');
      const [leaveRequestsRows] = await pool.query('SELECT * FROM leave_requests');
      const [settingsRows] = await pool.query('SELECT * FROM settings WHERE id = 1');
      
      const settings = settingsRows[0] || { apiKey: '', adminPassword: 'admin', logo: '' };

      // Parse JSON fields
      const projects = projectsRows.map(p => ({
        ...p,
        members: p.members ? JSON.parse(p.members) : []
      }));

      const tasks = tasksRows.map(t => ({
        ...t,
        subtasks: t.subtasks ? JSON.parse(t.subtasks) : [],
        dependencies: t.dependencies ? JSON.parse(t.dependencies) : []
      }));

      const notifications = notificationsRows.map(n => ({
        ...n,
        isRead: Boolean(n.isRead)
      }));

      const timesheets = timesheetsRows.map(t => ({
        ...t,
        entries: t.entries ? JSON.parse(t.entries) : [],
        isProcessed: Boolean(t.isProcessed),
        attachments: t.attachments ? JSON.parse(t.attachments) : []
      }));

      const leaveRequests = leaveRequestsRows.map(l => ({
        ...l,
        isProcessed: Boolean(l.isProcessed)
      }));

      res.json({
        apps,
        documents,
        projects,
        tasks,
        users,
        comments,
        notifications,
        timesheets,
        leaveRequests,
        apiKey: settings.apiKey,
        adminPassword: settings.adminPassword,
        logo: settings.logo || ''
      });
    } catch (error) {
      console.error("MySQL Read Error:", error);
      res.status(500).json(getDefaultData());
    }
  } else {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      res.json(getDefaultData());
    }
  }
});

app.post('/api/data', async (req, res) => {
  const { apps, documents, projects, tasks, users, comments, notifications, timesheets, leaveRequests, apiKey, adminPassword, logo } = req.body;

  if (useMySQL && pool) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Settings
      const [currentSettings] = await conn.query('SELECT logo FROM settings WHERE id = 1');
      const logoToSave = logo !== undefined ? logo : (currentSettings[0]?.logo || '');
      await conn.query('UPDATE settings SET apiKey = ?, adminPassword = ?, logo = ? WHERE id = 1', [apiKey || '', adminPassword || 'admin', logoToSave]);

      // Apps
      await conn.query('DELETE FROM apps');
      if (apps && apps.length > 0) {
        const appValues = apps.map(a => [a.id, a.name, a.description, a.icon, a.color, a.category, a.url]);
        await conn.query('INSERT INTO apps (id, name, description, icon, color, category, url) VALUES ?', [appValues]);
      }

      // Projects
      await conn.query('DELETE FROM projects');
      if (projects && projects.length > 0) {
        const projValues = projects.map(p => [
          p.id, p.name, p.description || '', p.color, p.status || 'active', p.priority || 'medium', p.startDate, p.endDate, p.createdAt, 
          JSON.stringify(p.members || [])
        ]);
        await conn.query('INSERT INTO projects (id, name, description, color, status, priority, startDate, endDate, createdAt, members) VALUES ?', [projValues]);
      }

      // Tasks
      await conn.query('DELETE FROM tasks');
      if (tasks && tasks.length > 0) {
        const taskValues = tasks.map(t => [
          t.id, t.projectId, t.title, t.description || '', t.status, t.priority, t.startDate, t.endDate, t.assignee || null,
          JSON.stringify(t.subtasks || []), JSON.stringify(t.dependencies || [])
        ]);
        await conn.query('INSERT INTO tasks (id, projectId, title, description, status, priority, startDate, endDate, assignee, subtasks, dependencies) VALUES ?', [taskValues]);
      }

      // Documents
      await conn.query('DELETE FROM documents');
      if (documents && documents.length > 0) {
        const docValues = documents.map(d => [d.id, d.name, d.type, d.uploadDate, d.content]);
        await conn.query('INSERT INTO documents (id, name, type, uploadDate, content) VALUES ?', [docValues]);
      }
      
      // Users
      await conn.query('DELETE FROM users');
      if (users && users.length > 0) {
        const userValues = users.map(u => [
          u.id, u.name, u.email, u.password || '', u.avatar || '', u.color, u.role || 'user', u.service || '', 
          u.employeeCode || '', u.jobTitle || '', u.secteur || ''
        ]);
        await conn.query('INSERT INTO users (id, name, email, password, avatar, color, role, service, employeeCode, jobTitle, secteur) VALUES ?', [userValues]);
      }

      // Comments
      await conn.query('DELETE FROM comments');
      if (comments && comments.length > 0) {
        const comValues = comments.map(c => [c.id, c.taskId, c.userId, c.text, c.createdAt]);
        await conn.query('INSERT INTO comments (id, taskId, userId, text, createdAt) VALUES ?', [comValues]);
      }

      // Notifications
      await conn.query('DELETE FROM notifications');
      if (notifications && notifications.length > 0) {
        const notifValues = notifications.map(n => [n.id, n.userId, n.type, n.message, n.isRead, n.createdAt, n.linkProjectId || null, n.linkTaskId || null]);
        await conn.query('INSERT INTO notifications (id, userId, type, message, isRead, createdAt, linkProjectId, linkTaskId) VALUES ?', [notifValues]);
      }

      // Timesheets
      await conn.query('DELETE FROM timesheets');
      if (timesheets && timesheets.length > 0) {
        const tsValues = timesheets.map(t => [
          t.id, 
          t.userId, 
          t.managerId || null, 
          t.weekStartDate, 
          t.status, 
          JSON.stringify(t.entries || []), 
          t.rejectionReason || '', 
          t.submittedAt || null, 
          t.isProcessed || false,
          t.type || 'standard',
          t.interimName || null,
          JSON.stringify(t.attachments || [])
        ]);
        await conn.query('INSERT INTO timesheets (id, userId, managerId, weekStartDate, status, entries, rejectionReason, submittedAt, isProcessed, type, interimName, attachments) VALUES ?', [tsValues]);
      }

      // Leave Requests
      await conn.query('DELETE FROM leave_requests');
      if (leaveRequests && leaveRequests.length > 0) {
        const leaveValues = leaveRequests.map(l => [l.id, l.userId, l.managerId || null, l.type, l.startDate, l.endDate, l.halfDay || null, l.reason || '', l.status, l.rejectionReason || '', l.createdAt, l.isProcessed || false]);
        await conn.query('INSERT INTO leave_requests (id, userId, managerId, type, startDate, endDate, halfDay, reason, status, rejectionReason, createdAt, isProcessed) VALUES ?', [leaveValues]);
      }

      await conn.commit();
      res.json({ success: true });
    } catch (error) {
      await conn.rollback();
      console.error("MySQL Write Error:", error);
      res.status(500).json({ error: 'Database save failed.' });
    } finally {
      conn.release();
    }
  } else {
    // Local File Mode
    try {
      const currentData = JSON.parse(await fs.readFile(DATA_FILE, 'utf8').catch(() => '{}'));
      const logoToSave = logo !== undefined ? logo : (currentData.logo || '');

      const dataToSave = { 
        apps, 
        documents, 
        projects, 
        tasks, 
        users: users || [],
        comments: comments || [],
        notifications: notifications || [],
        timesheets: timesheets || [],
        leaveRequests: leaveRequests || [],
        apiKey, 
        adminPassword,
        logo: logoToSave
      };
      await fs.writeFile(DATA_FILE, JSON.stringify(dataToSave, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Local save failed' });
    }
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});