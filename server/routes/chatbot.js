import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '../db/data.json');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'Local Expert (Offline)',
    apiKeyConfigured: true,
    apiKeyPreview: 'OFFLINE_MODE',
    engine: 'DBMS Knowledge Base (Local)'
  });
});

router.post('/ask', (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  const query = message.toLowerCase();
  
  try {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    let reply = "I'm your Local DBMS Expert! Please ask me about topics like Normalization, ACID properties, SQL, or ER Diagrams.";
    
    // Basic Keyword Search in Modules
    if (data.modules && Array.isArray(data.modules)) {
      for (const module of data.modules) {
        if (query.includes(module.title.toLowerCase()) || 
            module.description.toLowerCase().includes(query)) {
          reply = `Here is some information about **${module.title}**:\n\n${module.description}\n\nYou can learn more by visiting the Study Materials section!`;
          break;
        }
      }
    }

    // Specific hardcoded responses for common DBMS terms to make it feel smart
    if (query.includes('acid')) {
      reply = "**ACID Properties** stand for:\n- **Atomicity**: All or nothing.\n- **Consistency**: Data remains valid.\n- **Isolation**: Transactions don't interfere.\n- **Durability**: Changes are permanent.";
    } else if (query.includes('normaliz') || query.includes('1nf') || query.includes('2nf') || query.includes('3nf')) {
      reply = "**Normalization** is organizing data to reduce redundancy.\n- **1NF**: Atomic values.\n- **2NF**: No partial dependencies.\n- **3NF**: No transitive dependencies.\n- **BCNF**: Stricter 3NF.";
    } else if (query.includes('sql') || query.includes('select') || query.includes('join')) {
      reply = "**SQL (Structured Query Language)** is used to manage relational databases.\nKey commands include SELECT, INSERT, UPDATE, DELETE, and JOINs (Inner, Left, Right, Full).";
    } else if (query.includes('er diagram') || query.includes('entity')) {
      reply = "**ER Diagrams (Entity-Relationship)** visualize data.\n- **Entities** (Rectangles): Objects like 'Student'.\n- **Attributes** (Ellipses): Properties like 'Name'.\n- **Relationships** (Diamonds): Connections like 'Enrolled'.";
    } else if (query.includes('hi') || query.includes('hello')) {
      reply = "Hello! I am your Local DBMS Expert. How can I help you with database concepts today?";
    }

    // Simulate slight delay for realism
    setTimeout(() => {
      res.json({ reply, source: 'local_expert' });
    }, 800);

  } catch (err) {
    console.error('Local Expert Error:', err);
    res.status(500).json({ error: "Failed to access local knowledge base." });
  }
});

export default router;

