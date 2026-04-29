import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '../db/data.json');

/**
 * Local DB Utility that mimics Supabase's basic behavior 
 * by reading and writing to data.json
 */
class LocalDB {
  async getData() {
    const content = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(content);
  }

  async saveData(data) {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
  }

  // Mocking the Supabase builder pattern
  from(table) {
    let filters = [];
    let sortConfig = null;
    return {
      select: (query = '*') => {
        const builder = {
          eq: (col, val) => {
            filters.push((r) => r[col] == val); // Loose equality for true/1
            return builder;
          },
          or: (queryStr) => {
            const parts = queryStr.split(',');
            filters.push((r) => {
              return parts.some(p => {
                const [c, op, v] = p.split('.');
                return String(r[c]) === String(v);
              });
            });
            return builder;
          },
          order: (col, options = { ascending: true }) => {
            sortConfig = { col, ascending: options.ascending };
            return builder;
          },
          single: async () => {
            const { data } = await this._execute(table, filters, sortConfig);
            return { data: data[0] || null, error: null };
          },
          maybeSingle: async () => {
            const { data } = await this._execute(table, filters, sortConfig);
            return { data: data[0] || null, error: null };
          },
          then: async (cb) => {
            const res = await this._execute(table, filters, sortConfig);
            return cb(res);
          }
        };
        return builder;
      },
      insert: (rows) => {
        const builder = {
          select: () => builder,
          single: async () => await this._insert(table, rows),
          then: async (cb) => {
            const res = await this._insert(table, rows);
            return cb(res);
          }
        };
        return builder;
      },
      upsert: (rows) => {
        const builder = {
          select: () => builder,
          single: async () => await this._upsert(table, rows),
          then: async (cb) => {
            const res = await this._upsert(table, rows);
            return cb(res);
          }
        };
        return builder;
      },
      update: (updates) => {
        let eqCol, eqVal;
        const builder = {
          eq: (col, val) => {
            eqCol = col;
            eqVal = val;
            return builder;
          },
          select: () => builder,
          single: async () => await this._update(table, eqCol, eqVal, updates),
          then: async (cb) => {
            const res = await this._update(table, eqCol, eqVal, updates);
            return cb(res);
          }
        };
        return builder;
      },
      delete: () => {
        let eqCol, eqVal;
        const builder = {
          eq: (col, val) => {
            eqCol = col;
            eqVal = val;
            return builder;
          },
          select: () => builder,
          single: async () => await this._delete(table, eqCol, eqVal),
          then: async (cb) => {
            const res = await this._delete(table, eqCol, eqVal);
            return cb(res);
          }
        };
        return builder;
      }
    };
  }

  async _execute(table, filters, sortConfig) {
    const data = await this.getData();
    let rows = data[table] || [];
    filters.forEach(f => {
      rows = rows.filter(f);
    });

    if (sortConfig) {
      const { col, ascending } = sortConfig;
      rows.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });
    }

    // Enrich data to simulate Supabase JOINs
    rows = this._enrichData(table, rows, data);

    return { data: rows, error: null };
  }

  _enrichData(table, rows, data) {
    if (table === 'quizzes') {
      return rows.map(r => ({
        ...r,
        questions: (data['questions'] || []).filter(q => q.quiz_id === r.id),
        quiz_attempts: (data['quiz_attempts'] || []).filter(a => a.quiz_id === r.id),
        modules: (data['modules'] || []).find(m => m.id === r.module_id) || null,
        users: (data['users'] || []).find(u => u.id === r.created_by) || null
      }));
    }
    if (table === 'quiz_attempts') {
      return rows.map(r => ({
        ...r,
        answers: (data['answers'] || []).filter(a => a.attempt_id === r.id),
        quizzes: (data['quizzes'] || []).find(q => q.id === r.quiz_id) || null,
        users: (data['users'] || []).find(u => u.id === r.student_id) || null
      }));
    }
    if (table === 'answers') {
      return rows.map(r => ({
        ...r,
        questions: (data['questions'] || []).find(q => q.id === r.question_id) || null
      }));
    }
    if (table === 'users') {
      return rows.map(r => ({
        ...r,
        quiz_attempts: (data['quiz_attempts'] || []).filter(a => a.student_id === r.id)
      }));
    }
    return rows;
  }

  async _insert(table, rows) {
    const data = await this.getData();
    if (!data[table]) data[table] = [];
    
    // Auto-generate IDs and timestamps to mimic Supabase defaults
    const newRows = (Array.isArray(rows) ? rows : [rows]).map(row => {
      const now = new Date().toISOString();
      return {
        id: row.id || crypto.randomUUID(),
        created_at: row.created_at || now,
        started_at: row.started_at || (table === 'quiz_attempts' ? now : undefined),
        ...row
      };
    });

    data[table].push(...newRows);
    await this.saveData(data);
    return { data: newRows[0], error: null };
  }

  async _upsert(table, rows) {
    const data = await this.getData();
    if (!data[table]) data[table] = [];
    const items = Array.isArray(rows) ? rows : [rows];
    items.forEach(item => {
      const idx = data[table].findIndex(r => r.id === item.id);
      if (idx > -1) data[table][idx] = { ...data[table][idx], ...item };
      else data[table].push(item);
    });
    await this.saveData(data);
    return { data: items[0], error: null };
  }

  async _update(table, col, val, updates) {
    const data = await this.getData();
    const rows = data[table] || [];
    rows.forEach((r, idx) => {
      if (r[col] === val) data[table][idx] = { ...r, ...updates };
    });
    await this.saveData(data);
    return { data: null, error: null };
  }

  async _delete(table, col, val) {
    const data = await this.getData();
    if (data[table]) {
      data[table] = data[table].filter(r => r[col] !== val);
      await this.saveData(data);
    }
    return { data: null, error: null };
  }
}

export const localDB = new LocalDB();
