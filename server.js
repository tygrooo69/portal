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
        createdAt VARCHAR(50)
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
        INDEX idx_project (projectId)
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

    // Documents Table (Content is LONGTEXT for base64/large text)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(50),
        uploadDate VARCHAR(50),
        content LONGTEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Settings Table (Single row)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        apiKey TEXT,
        adminPassword TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert default settings row if not exists
    await conn.query(`
      INSERT IGNORE INTO settings (id, apiKey, adminPassword) VALUES (1, '', 'admin');
    `);

    console.log("✅ Database schema initialized.");
  } finally {
    conn.release();
  }
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for docs
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'dist')));

const getDefaultData = () => ({ 
  apps: [], 
  documents: [], 
  projects: [],
  tasks: [],
  apiKey: "", 
  adminPassword: "admin" 
});

// --- Routes ---

app.get('/api/data', async (req, res) => {
  if (useMySQL && pool) {
    try {
      const [projects] = await pool.query('SELECT * FROM projects');
      const [tasks] = await pool.query('SELECT * FROM tasks');
      const [apps] = await pool.query('SELECT * FROM apps');
      const [documents] = await pool.query('SELECT * FROM documents');
      const [settingsRows] = await pool.query('SELECT * FROM settings WHERE id = 1');
      
      const settings = settingsRows[0] || { apiKey: '', adminPassword: 'admin' };

      res.json({
        apps,
        documents,
        projects,
        tasks,
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
  const { apps, documents, projects, tasks, apiKey, adminPassword } = req.body;

  if (useMySQL && pool) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Settings
      await conn.query('UPDATE settings SET apiKey = ?, adminPassword = ? WHERE id = 1', [apiKey || '', adminPassword || 'admin']);

      // 2. Apps
      await conn.query('DELETE FROM apps'); // Clear table
      if (apps && apps.length > 0) {
        const appValues = apps.map(a => [a.id, a.name, a.description, a.icon, a.color, a.category, a.url]);
        await conn.query('INSERT INTO apps (id, name, description, icon, color, category, url) VALUES ?', [appValues]);
      }

      // 3. Projects
      await conn.query('DELETE FROM projects');
      if (projects && projects.length > 0) {
        const projValues = projects.map(p => [
          p.id, p.name, p.description || '', p.color, p.status || 'active', p.priority || 'medium', p.startDate, p.endDate, p.createdAt
        ]);
        await conn.query('INSERT INTO projects (id, name, description, color, status, priority, startDate, endDate, createdAt) VALUES ?', [projValues]);
      }

      // 4. Tasks
      await conn.query('DELETE FROM tasks');
      if (tasks && tasks.length > 0) {
        const taskValues = tasks.map(t => [
          t.id, t.projectId, t.title, t.description || '', t.status, t.priority, t.startDate, t.endDate
        ]);
        await conn.query('INSERT INTO tasks (id, projectId, title, description, status, priority, startDate, endDate) VALUES ?', [taskValues]);
      }

      // 5. Documents
      await conn.query('DELETE FROM documents');
      if (documents && documents.length > 0) {
        const docValues = documents.map(d => [d.id, d.name, d.type, d.uploadDate, d.content]);
        await conn.query('INSERT INTO documents (id, name, type, uploadDate, content) VALUES ?', [docValues]);
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
      const dataToSave = { apps, documents, projects, tasks, apiKey, adminPassword };
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