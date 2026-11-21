
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple File-based storage for multi-user support
  const PETS_FILE = path.join(process.cwd(), 'pets.json');
  const loadPets = () => {
    if (!fs.existsSync(PETS_FILE)) return [];
    try {
      return JSON.parse(fs.readFileSync(PETS_FILE, 'utf-8'));
    } catch (e) {
      return [];
    }
  };
  const savePets = (pets: any[]) => {
    fs.writeFileSync(PETS_FILE, JSON.stringify(pets, null, 2));
  };

  // API Route for pets
  app.get('/api/pets', (req, res) => {
    res.json(loadPets());
  });

  app.post('/api/pets', (req, res) => {
    const newPet = req.body;
    const pets = loadPets();
    const index = pets.findIndex((p: any) => p.id === newPet.id);
    if (index >= 0) {
      pets[index] = newPet;
    } else {
      pets.push(newPet);
    }
    savePets(pets);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
