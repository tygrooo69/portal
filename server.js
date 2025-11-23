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

// Ensure data directory exists
(async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
})();

app.use(cors());
// Increase limit to 50mb to handle large document uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'dist')));

// API: Get Data
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Return default structure if file doesn't exist
      res.json({ apps: [], documents: [], apiKey: "", adminPassword: "admin" });
    } else {
      console.error("Read error:", error);
      res.status(500).json({ error: 'Failed to read data' });
    }
  }
});

// API: Save Data
app.post('/api/data', async (req, res) => {
  try {
    // Destructure fields
    const { apps, documents, apiKey, adminPassword } = req.body;
    
    // Read existing data to preserve fields if not provided
    let existingData = {};
    try {
       const fileContent = await fs.readFile(DATA_FILE, 'utf8');
       existingData = JSON.parse(fileContent);
    } catch (e) { /* ignore if file missing */ }

    const dataToSave = {
      apps: apps || existingData.apps || [],
      documents: documents || existingData.documents || [],
      apiKey: apiKey !== undefined ? apiKey : (existingData.apiKey || ""),
      adminPassword: adminPassword !== undefined ? adminPassword : (existingData.adminPassword || "admin")
    };

    await fs.writeFile(DATA_FILE, JSON.stringify(dataToSave, null, 2));
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