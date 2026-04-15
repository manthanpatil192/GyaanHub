import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'data.json');

// In-memory database store
let store = null;

function defaultStore() {
  return {
    users: [],
    modules: [],
    quizzes: [],
    questions: [],
    quiz_attempts: [],
    answers: [],
    materials: [],
    purchases: [],
    er_diagrams: []
  };
}

export function getDb() {
  if (!store) {
    if (existsSync(DB_PATH)) {
      try {
        store = JSON.parse(readFileSync(DB_PATH, 'utf-8'));
        // Ensure all tables exist (migration for new tables)
        const defaults = defaultStore();
        for (const key of Object.keys(defaults)) {
          if (!store[key]) store[key] = [];
        }
      } catch {
        store = defaultStore();
      }
    } else {
      store = defaultStore();
    }
  }
  return store;
}

export function saveDb() {
  writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

// Helper query methods to mimic SQL-like behavior
export const db = {
  get store() {
    return getDb();
  },

  // Find single record
  findOne(table, predicate) {
    return getDb()[table].find(predicate) || null;
  },

  // Find all matching records
  findAll(table, predicate) {
    if (!predicate) return [...getDb()[table]];
    return getDb()[table].filter(predicate);
  },

  // Insert a record
  insert(table, record) {
    getDb()[table].push(record);
    saveDb();
    return record;
  },

  // Update records matching predicate
  update(table, predicate, updates) {
    const store = getDb();
    let updated = null;
    store[table] = store[table].map(item => {
      if (predicate(item)) {
        updated = { ...item, ...updates };
        return updated;
      }
      return item;
    });
    saveDb();
    return updated;
  },

  // Delete records matching predicate
  delete(table, predicate) {
    const store = getDb();
    const before = store[table].length;
    store[table] = store[table].filter(item => !predicate(item));
    saveDb();
    return before - store[table].length;
  },

  // Count records
  count(table, predicate) {
    if (!predicate) return getDb()[table].length;
    return getDb()[table].filter(predicate).length;
  },

  // Clear a table
  clear(table) {
    getDb()[table] = [];
    saveDb();
  },

  // Clear all data
  clearAll() {
    const s = getDb();
    for (const key of Object.keys(s)) {
      s[key] = [];
    }
    saveDb();
  }
};

export default db;
