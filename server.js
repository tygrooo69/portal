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
        color VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Add password column if it doesn't exist (Migration)
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255)`);
      console.log("Migration: Added 'password' column to users.");
    } catch (e) {
       // Ignore if exists
    }

    // Seed Users if empty
    const [existingUsers] = await conn.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      console.log("Seeding default users...");
      await conn.query(`
        INSERT INTO users (id, name, email, password, color) VALUES 
        ('u1', 'Alice Dubois', 'alice@lumina.com', '1234', 'bg-pink-500'),
        ('u2', 'Marc Martin', 'marc@lumina.com', '1234', 'bg-blue-500'),
        ('u3', 'Sophie Bernard', 'sophie@lumina.com', '1234', 'bg-purple-500'),
        ('u4', 'Thomas Petit', 'thomas@lumina.com', '1234', 'bg-green-500');
      `);
    }

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

    try {
      await conn.query(`ALTER TABLE projects ADD COLUMN members TEXT`);
    } catch (e) { /* ignore */ }

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

    try {
      await conn.query(`ALTER TABLE tasks ADD COLUMN assignee VARCHAR(255)`);
    } catch (e) { /* ignore */ }

    try {
      await conn.query(`ALTER TABLE tasks ADD COLUMN subtasks LONGTEXT`);
      console.log("Migration: Added 'subtasks' column to tasks.");
    } catch (e) { /* ignore */ }

    try {
      await conn.query(`ALTER TABLE tasks ADD COLUMN dependencies LONGTEXT`);
      console.log("Migration: Added 'dependencies' column to tasks.");
    } catch (e) { /* ignore */ }

    // Comments Table (New)
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

    // Notifications Table (New)
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
        adminPassword TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      INSERT IGNORE INTO settings (id, apiKey, adminPassword) VALUES (1, '', 'admin');
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
  apiKey: "", 
  adminPassword: "admin" 
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
      const [settingsRows] = await pool.query('SELECT * FROM settings WHERE id = 1');
      
      const settings = settingsRows[0] || { apiKey: '', adminPassword: 'admin' };

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
        isRead: Boolean(n.isRead) // Ensure boolean
      }));

      res.json({
        apps,
        documents,
        projects,
        tasks,
        users,
        comments,
        notifications,
        apiKey: settings.apiKey,
        adminPassword: settings.adminPassword
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
  const { apps, documents, projects, tasks, users, comments, notifications, apiKey, adminPassword } = req.body;

  if (useMySQL && pool) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Settings
      await conn.query('UPDATE settings SET apiKey = ?, adminPassword = ? WHERE id = 1', [apiKey || '', adminPassword || 'admin']);

      // 2. Apps
      await conn.query('DELETE FROM apps');
      if (apps && apps.length > 0) {
        const appValues = apps.map(a => [a.id, a.name, a.description, a.icon, a.color, a.category, a.url]);
        await conn.query('INSERT INTO apps (id, name, description, icon, color, category, url) VALUES ?', [appValues]);
      }

      // 3. Projects
      await conn.query('DELETE FROM projects');
      if (projects && projects.length > 0) {
        const projValues = projects.map(p => [
          p.id, p.name, p.description || '', p.color, p.status || 'active', p.priority || 'medium', p.startDate, p.endDate, p.createdAt, 
          JSON.stringify(p.members || [])
        ]);
        await conn.query('INSERT INTO projects (id, name, description, color, status, priority, startDate, endDate, createdAt, members) VALUES ?', [projValues]);
      }

      // 4. Tasks
      await conn.query('DELETE FROM tasks');
      if (tasks && tasks.length > 0) {
        const taskValues = tasks.map(t => [
          t.id, t.projectId, t.title, t.description || '', t.status, t.priority, t.startDate, t.endDate, t.assignee || null,
          JSON.stringify(t.subtasks || []), JSON.stringify(t.dependencies || [])
        ]);
        await conn.query('INSERT INTO tasks (id, projectId, title, description, status, priority, startDate, endDate, assignee, subtasks, dependencies) VALUES ?', [taskValues]);
      }

      // 5. Documents
      await conn.query('DELETE FROM documents');
      if (documents && documents.length > 0) {
        const docValues = documents.map(d => [d.id, d.name, d.type, d.uploadDate, d.content]);
        await conn.query('INSERT INTO documents (id, name, type, uploadDate, content) VALUES ?', [docValues]);
      }
      
      // 6. Users
      await conn.query('DELETE FROM users');
      if (users && users.length > 0) {
        const userValues = users.map(u => [u.id, u.name, u.email, u.password || '', u.avatar || '', u.color]);
        await conn.query('INSERT INTO users (id, name, email, password, avatar, color) VALUES ?', [userValues]);
      }

      // 7. Comments
      await conn.query('DELETE FROM comments');
      if (comments && comments.length > 0) {
        const comValues = comments.map(c => [c.id, c.taskId, c.userId, c.text, c.createdAt]);
        await conn.query('INSERT INTO comments (id, taskId, userId, text, createdAt) VALUES ?', [comValues]);
      }

      // 8. Notifications
      await conn.query('DELETE FROM notifications');
      if (notifications && notifications.length > 0) {
        const notifValues = notifications.map(n => [n.id, n.userId, n.type, n.message, n.isRead, n.createdAt, n.linkProjectId || null, n.linkTaskId || null]);
        await conn.query('INSERT INTO notifications (id, userId, type, message, isRead, createdAt, linkProjectId, linkTaskId) VALUES ?', [notifValues]);
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
      const dataToSave = { 
        apps, 
        documents, 
        projects, 
        tasks, 
        users: users || [],
        comments: comments || [],
        notifications: notifications || [],
        apiKey, 
        adminPassword 
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