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
const NOCODB_URL = process.env.NOCODB_URL; // ex: http://192.168.1.50:8080
const NOCODB_TOKEN = process.env.NOCODB_TOKEN; // API Token (xc-token)
const NOCODB_TABLE_ID = process.env.NOCODB_TABLE_ID; // Table ID
const NOCODB_ROW_ID = process.env.NOCODB_ROW_ID || '1'; // Default to row 1

// Check if NocoDB is configured
const useNocoDB = !!(NOCODB_URL && NOCODB_TOKEN && NOCODB_TABLE_ID);

if (useNocoDB) {
  console.log(`🔌 Mode NocoDB activé sur ${NOCODB_URL} (Table: ${NOCODB_TABLE_ID})`);
} else {
  console.log("📂 Mode Fichier Local activé (storage.json)");
  // Ensure data directory exists only if using local file
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

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'dist')));

// --- Helper Functions for Storage Strategy ---

const getDefaultData = () => ({ 
  apps: [], 
  documents: [], 
  apiKey: "", 
  adminPassword: "admin" 
});

// Strategy: Load Data
const loadData = async () => {
  if (useNocoDB) {
    try {
      const targetUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records/${NOCODB_ROW_ID}`;
      console.log(`Fetching NocoDB: ${targetUrl}`);
      
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'xc-token': NOCODB_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn("NocoDB Row not found. Returning default data.");
          return getDefaultData();
        }
        const errText = await response.text();
        throw new Error(`NocoDB API Error (${response.status}): ${errText}`);
      }

      const json = await response.json();
      
      // NocoDB returns the record. We look for a 'Data' column (case sensitive).
      // Fallback to lowercase 'data' if 'Data' is missing.
      const payload = json.Data || json.data;

      if (!payload) {
        console.warn("NocoDB record found but 'Data' column is empty.");
        return getDefaultData();
      }
      
      // If NocoDB stores it as a stringified JSON, parse it. If it's already an object (JSON type), use it.
      return typeof payload === 'string' ? JSON.parse(payload) : payload;

    } catch (error) {
      console.error("Failed to load from NocoDB:", error);
      // Fallback to default in case of connection error to allow app to load (albeit empty)
      return getDefaultData();
    }
  } else {
    // Local File Strategy
    try {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return getDefaultData();
      }
      throw error;
    }
  }
};

// Strategy: Save Data
const saveData = async (dataToSave) => {
  if (useNocoDB) {
    try {
      // Wrap the app state into the 'Data' column structure expected by NocoDB
      const body = {
        Data: dataToSave // Assuming the column name is 'Data' and type is JSON
      };

      const targetUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records/${NOCODB_ROW_ID}`;
      
      // Try to update existing record
      let response = await fetch(targetUrl, {
        method: 'PATCH',
        headers: {
          'xc-token': NOCODB_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      // If record 1 doesn't exist (404), try to create it
      if (response.status === 404) {
        console.log("NocoDB Row not found, attempting to create...");
        const createUrl = `${NOCODB_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records`;
        response = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'xc-token': NOCODB_TOKEN,
              'Content-Type': 'application/json'
            },
            // We try to force ID if possible, otherwise we rely on just creating a row
            body: JSON.stringify({ ...body, Id: NOCODB_ROW_ID }) 
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`NocoDB Save Failed (${response.status}): ${errText}`);
      }
      
      return true;
    } catch (error) {
      console.error("Failed to save to NocoDB:", error);
      throw error;
    }
  } else {
    // Local File Strategy
    await fs.writeFile(DATA_FILE, JSON.stringify(dataToSave, null, 2));
    return true;
  }
};

// --- Routes ---

// API: Get Data
app.get('/api/data', async (req, res) => {
  try {
    const data = await loadData();
    res.json(data);
  } catch (error) {
    console.error("Read error:", error);
    // Return default data structure on error to prevent frontend crash
    res.json({ apps: [], documents: [], apiKey: "", adminPassword: "admin" });
  }
});

// API: Save Data
app.post('/api/data', async (req, res) => {
  try {
    const { apps, documents, apiKey, adminPassword } = req.body;
    
    // Load existing data to merge/preserve fields if partial update (though frontend sends full state usually)
    let existingData = await loadData();

    const dataToSave = {
      apps: apps || existingData.apps || [],
      documents: documents || existingData.documents || [],
      apiKey: apiKey !== undefined ? apiKey : (existingData.apiKey || ""),
      adminPassword: adminPassword !== undefined ? adminPassword : (existingData.adminPassword || "admin")
    };

    await saveData(dataToSave);
    res.json({ success: true });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Handle React Routing (return index.html for any unknown route)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});