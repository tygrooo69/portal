import 'dotenv/config'; // Charge les variables du fichier .env
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'storage.json');

// --- NocoDB Configuration ---
const NOCODB_URL = process.env.NOCODB_URL; // ex: http://localhost:8080
const NOCODB_TOKEN = process.env.NOCODB_TOKEN; // API Token (xc-token)

// Table IDs / Names from Environment Variables
const TABLE_PROJECTS = process.env.NOCO_TABLE_PROJECTS;
const TABLE_TASKS = process.env.NOCO_TABLE_TASKS;
const TABLE_APPS = process.env.NOCO_TABLE_APPS;
const TABLE_DOCS = process.env.NOCO_TABLE_DOCS;
const TABLE_SETTINGS = process.env.NOCO_TABLE_SETTINGS;

// Check if NocoDB is fully configured
const useNocoDB = !!(NOCODB_URL && NOCODB_TOKEN && TABLE_PROJECTS && TABLE_TASKS && TABLE_APPS && TABLE_DOCS && TABLE_SETTINGS);

if (useNocoDB) {
  console.log(`🔌 Mode NocoDB Multi-Tables activé sur ${NOCODB_URL}`);
  console.log(`   Tables: Projets(${TABLE_PROJECTS}), Tâches(${TABLE_TASKS}), Apps(${TABLE_APPS}), Docs(${TABLE_DOCS}), Settings(${TABLE_SETTINGS})`);
} else {
  console.log("📂 Mode Fichier Local activé (storage.json)");
  console.log("   Pour activer NocoDB, créez un fichier .env avec NOCODB_URL, NOCODB_TOKEN et les IDs des tables.");
  (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
      console.error('Error creating data directory:', err);
    }
  })();
}

app.use(cors());
// Increase limit to 50mb to handle large document uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname, 'dist')));

// --- Helper Functions ---

const getDefaultData = () => ({ 
  apps: [], 
  documents: [], 
  projects: [],
  tasks: [],
  apiKey: "", 
  adminPassword: "admin" 
});

// Generic NocoDB Fetch
const nocoFetch = async (tableId, query = {}) => {
  try {
    const url = new URL(`${NOCODB_URL}/api/v2/tables/${tableId}/records`);
    url.searchParams.append('limit', '1000'); // Fetch max 1000 records
    url.searchParams.append('offset', '0');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'xc-token': NOCODB_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`Fetch Error ${response.status}`);
    const json = await response.json();
    return json.list || [];
  } catch (e) {
    console.error(`Error fetching table ${tableId}:`, e.message);
    return [];
  }
};

// Generic NocoDB Sync Logic (Create/Update/Delete)
// We use the 'id' field from frontend as the reference
const syncTable = async (tableId, incomingItems) => {
  // 1. Fetch existing
  const existingRecords = await nocoFetch(tableId);
  
  // Map internal NocoDB ID (Id) to our Frontend ID (id)
  // existingRecords have { Id: 1, id: "frontend-guid", ... }
  const existingMap = new Map();
  existingRecords.forEach(r => {
    if (r.id) existingMap.set(r.id, r.Id); // Map frontend ID -> NocoDB Row ID
  });

  const incomingIds = new Set(incomingItems.map(i => i.id));
  
  // 2. Identify Actions
  const toCreate = [];
  const toUpdate = [];
  const toDelete = [];

  // Find Creates and Updates
  for (const item of incomingItems) {
    if (existingMap.has(item.id)) {
      // It exists, update it. We attach the NocoDB Row ID ('Id') for the API
      toUpdate.push({ ...item, Id: existingMap.get(item.id) });
    } else {
      toCreate.push(item);
    }
  }

  // Find Deletes
  existingRecords.forEach(r => {
    if (r.id && !incomingIds.has(r.id)) {
      toDelete.push({ Id: r.Id });
    }
  });

  // 3. Execute Actions (Batch if possible)
  const baseUrl = `${NOCODB_URL}/api/v2/tables/${tableId}/records`;
  const headers = { 'xc-token': NOCODB_TOKEN, 'Content-Type': 'application/json' };

  const operations = [];

  if (toCreate.length > 0) {
    // Chunking creates (NocoDB limit usually 25-100)
    const chunkSize = 50;
    for (let i = 0; i < toCreate.length; i += chunkSize) {
        operations.push(fetch(baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(toCreate.slice(i, i + chunkSize))
        }));
    }
  }

  if (toUpdate.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < toUpdate.length; i += chunkSize) {
        operations.push(fetch(baseUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(toUpdate.slice(i, i + chunkSize))
        }));
    }
  }

  if (toDelete.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
        operations.push(fetch(baseUrl, {
            method: 'DELETE',
            headers,
            body: JSON.stringify(toDelete.slice(i, i + chunkSize))
        }));
    }
  }

  await Promise.all(operations);
  console.log(`[SYNC] ${tableId} -> Created: ${toCreate.length}, Updated: ${toUpdate.length}, Deleted: ${toDelete.length}`);
};

// Special Handler for Settings (Single Row)
const syncSettings = async (settingsData) => {
    const records = await nocoFetch(TABLE_SETTINGS);
    const baseUrl = `${NOCODB_URL}/api/v2/tables/${TABLE_SETTINGS}/records`;
    const headers = { 'xc-token': NOCODB_TOKEN, 'Content-Type': 'application/json' };

    if (records.length > 0) {
        // Update first row
        await fetch(baseUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ Id: records[0].Id, ...settingsData })
        });
    } else {
        // Create
        await fetch(baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(settingsData)
        });
    }
};

// --- Main Routes ---

app.get('/api/data', async (req, res) => {
  if (useNocoDB) {
    try {
      const [apps, documents, projects, tasks, settingsList] = await Promise.all([
        nocoFetch(TABLE_APPS),
        nocoFetch(TABLE_DOCS),
        nocoFetch(TABLE_PROJECTS),
        nocoFetch(TABLE_TASKS),
        nocoFetch(TABLE_SETTINGS)
      ]);

      const settings = settingsList[0] || {};

      res.json({
        apps,
        documents,
        projects,
        tasks,
        apiKey: settings.apiKey || "",
        adminPassword: settings.adminPassword || "admin"
      });
    } catch (error) {
      console.error("NocoDB Read Error:", error);
      res.json(getDefaultData());
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

  if (useNocoDB) {
    try {
      // Execute syncs in parallel
      await Promise.all([
        syncTable(TABLE_APPS, apps || []),
        syncTable(TABLE_DOCS, documents || []), // Note: Heavy if docs are huge
        syncTable(TABLE_PROJECTS, projects || []),
        syncTable(TABLE_TASKS, tasks || []),
        syncSettings({ apiKey, adminPassword })
      ]);
      
      res.json({ success: true });
    } catch (error) {
      console.error("NocoDB Save Error:", error);
      res.status(500).json({ error: 'Database sync failed' });
    }
  } else {
    // Local File Strategy
    try {
      let existingData = {};
      try {
        const fileContent = await fs.readFile(DATA_FILE, 'utf8');
        existingData = JSON.parse(fileContent);
      } catch (e) { /* ignore */ }

      const dataToSave = {
        apps: apps || existingData.apps || [],
        documents: documents || existingData.documents || [],
        projects: projects || existingData.projects || [],
        tasks: tasks || existingData.tasks || [],
        apiKey: apiKey !== undefined ? apiKey : (existingData.apiKey || ""),
        adminPassword: adminPassword !== undefined ? adminPassword : (existingData.adminPassword || "admin")
      };

      await fs.writeFile(DATA_FILE, JSON.stringify(dataToSave, null, 2));
      res.json({ success: true });
    } catch (error) {
      console.error("Local Save Error:", error);
      res.status(500).json({ error: 'Failed to save data locally' });
    }
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});