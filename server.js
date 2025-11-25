import 'dotenv/config';
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
const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;

// Table IDs / Names from Environment Variables
const TABLE_PROJECTS = process.env.NOCO_TABLE_PROJECTS;
const TABLE_TASKS = process.env.NOCO_TABLE_TASKS;
const TABLE_APPS = process.env.NOCO_TABLE_APPS;
const TABLE_DOCS = process.env.NOCO_TABLE_DOCS;
const TABLE_SETTINGS = process.env.NOCO_TABLE_SETTINGS;

const useNocoDB = !!(NOCODB_URL && NOCODB_TOKEN && TABLE_PROJECTS && TABLE_TASKS && TABLE_APPS && TABLE_DOCS && TABLE_SETTINGS);

if (useNocoDB) {
  console.log(`🔌 Mode NocoDB Multi-Tables activé sur ${NOCODB_URL}`);
  console.log(`   Tables Configured: Projects, Tasks, Apps, Docs, Settings`);
} else {
  console.log("📂 Mode Fichier Local activé (storage.json)");
  (async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
      console.error('Error creating data directory:', err);
    }
  })();
}

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'dist')));

// --- Helpers ---

const getDefaultData = () => ({ 
  apps: [], 
  documents: [], 
  projects: [],
  tasks: [],
  apiKey: "", 
  adminPassword: "admin" 
});

// Normalize NocoDB record for Frontend (Map system columns back to camelCase)
const normalizeFromNoco = (record) => {
  const normalized = { ...record };
  
  // If NocoDB has 'CreatedAt' system column, map it to 'createdAt' if not present
  if (normalized.CreatedAt && !normalized.createdAt) {
    normalized.createdAt = normalized.CreatedAt;
  }
  // Same for UpdatedAt
  if (normalized.UpdatedAt && !normalized.updatedAt) {
    normalized.updatedAt = normalized.UpdatedAt;
  }
  
  return normalized;
};

// Sanitize object for NocoDB (remove system columns, handle empty dates)
const sanitizeForNoco = (item) => {
  const clean = { ...item };
  const dateFields = ['startDate', 'endDate', 'uploadDate'];
  
  // CRITICAL: Remove system columns that cannot be written to
  // Even if they exist in our frontend model, we must not send them to NocoDB
  // because NocoDB manages them automatically and throws an error if we try to set them.
  delete clean.CreatedAt;
  delete clean.UpdatedAt;
  delete clean.createdAt; 
  delete clean.updatedAt;
  delete clean.Id; // System ID should not be in payload (we use it in URL or existingMap)
  
  Object.keys(clean).forEach(key => {
    // Handle empty strings for Date fields (NocoDB rejects "" for Date columns)
    if (clean[key] === '') {
      if (dateFields.includes(key)) {
        clean[key] = null;
      }
    }
  });
  return clean;
};

// Generic Fetch with Pagination to get ALL records
const nocoFetchAll = async (tableId) => {
  let allRecords = [];
  let offset = 0;
  const limit = 1000;
  let keepFetching = true;

  try {
    while (keepFetching) {
      const url = new URL(`${NOCODB_URL}/api/v2/tables/${tableId}/records`);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'xc-token': NOCODB_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Fetch failed ${response.status}: ${errText}`);
      }

      const json = await response.json();
      const list = json.list || [];
      
      // Normalize immediately after fetch
      const normalizedList = list.map(normalizeFromNoco);
      allRecords = [...allRecords, ...normalizedList];

      if (list.length < limit) {
        keepFetching = false;
      } else {
        offset += limit;
      }
    }
    return allRecords;
  } catch (e) {
    console.error(`[NocoDB] Error fetching table ${tableId}:`, e.message);
    throw e; 
  }
};

// Generic Sync Logic
const syncTable = async (tableId, incomingItems) => {
  try {
    // 1. Fetch Existing
    const existingRecords = await nocoFetchAll(tableId);

    // Map: Frontend ID (column 'id') -> NocoDB Row ID (column 'Id')
    const existingMap = new Map();
    existingRecords.forEach(r => {
      if (r.id) existingMap.set(r.id, r.Id);
    });

    const incomingIds = new Set(incomingItems.map(i => i.id));

    // 2. Prepare Batches
    const toCreate = [];
    const toUpdate = [];
    const toDelete = [];

    // Identify Create/Update
    for (const item of incomingItems) {
      const cleanItem = sanitizeForNoco(item);
      
      if (existingMap.has(item.id)) {
        // Update: We need the System 'Id' to identify the row for NocoDB
        toUpdate.push({ ...cleanItem, Id: existingMap.get(item.id) });
      } else {
        // Create: Just the data
        toCreate.push(cleanItem);
      }
    }

    // Identify Delete
    existingRecords.forEach(r => {
      // Only delete if it has a custom 'id' field that is no longer present in incoming data
      // This protects against deleting rows that might have been created manually in NocoDB without an 'id'
      if (r.id && !incomingIds.has(r.id)) {
        toDelete.push({ Id: r.Id });
      }
    });

    // 3. Execute
    const baseUrl = `${NOCODB_URL}/api/v2/tables/${tableId}/records`;
    const headers = { 'xc-token': NOCODB_TOKEN, 'Content-Type': 'application/json' };

    const executeBatch = async (method, records) => {
      if (records.length === 0) return;
      
      const chunkSize = 50; // Safe batch size
      for (let i = 0; i < records.length; i += chunkSize) {
        const batch = records.slice(i, i + chunkSize);
        
        const res = await fetch(baseUrl, {
          method,
          headers,
          body: JSON.stringify(batch)
        });

        if (!res.ok) {
          const errText = await responseText(res); // Safe text extraction
          console.error(`[NocoDB] Sync Error (${method}) on ${tableId}:`, errText);
          throw new Error(`NocoDB ${method} failed: ${errText}`);
        }
      }
    };
    
    // Helper to safely get text from response clone
    const responseText = async (res) => {
        try { return await res.clone().text(); } catch(e) { return "Unknown error"; }
    };

    await executeBatch('POST', toCreate);
    await executeBatch('PATCH', toUpdate);
    await executeBatch('DELETE', toDelete);

    console.log(`[SYNC] ${tableId} -> +${toCreate.length} ~${toUpdate.length} -${toDelete.length}`);
  } catch (err) {
    console.error(`[SYNC FAILED] Table ${tableId}:`, err.message);
    throw err; // Re-throw to ensure POST /api/data returns error
  }
};

const syncSettings = async (settingsData) => {
  try {
    const records = await nocoFetchAll(TABLE_SETTINGS);
    const baseUrl = `${NOCODB_URL}/api/v2/tables/${TABLE_SETTINGS}/records`;
    const headers = { 'xc-token': NOCODB_TOKEN, 'Content-Type': 'application/json' };

    if (records.length > 0) {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ Id: records[0].Id, ...settingsData })
      });
      if (!res.ok) console.error("Settings Update Failed", await res.text());
    } else {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(settingsData)
      });
      if (!res.ok) console.error("Settings Create Failed", await res.text());
    }
  } catch (e) {
    console.error("Settings Sync Error", e);
  }
};

// --- Routes ---

app.get('/api/data', async (req, res) => {
  if (useNocoDB) {
    try {
      const [apps, documents, projects, tasks, settingsList] = await Promise.all([
        nocoFetchAll(TABLE_APPS).catch(e => []),
        nocoFetchAll(TABLE_DOCS).catch(e => []),
        nocoFetchAll(TABLE_PROJECTS).catch(e => []),
        nocoFetchAll(TABLE_TASKS).catch(e => []),
        nocoFetchAll(TABLE_SETTINGS).catch(e => [])
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
      console.error("Critical Read Error:", error);
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

  if (useNocoDB) {
    try {
      // We process tables sequentially or using Promise.allSettled to better debug
      // Using Promise.all so if one fails we know, but we try to log specific errors inside syncTable
      await Promise.all([
        syncTable(TABLE_APPS, apps || []),
        syncTable(TABLE_DOCS, documents || []),
        syncTable(TABLE_PROJECTS, projects || []),
        syncTable(TABLE_TASKS, tasks || []),
        syncSettings({ apiKey, adminPassword })
      ]);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Global Save Error:", error.message);
      res.status(500).json({ error: 'Synchronization failed. Check server logs.' });
    }
  } else {
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