import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';

sqlite3.verbose();

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', 'data', 'dev.db');

if (!process.env.DATABASE_URL) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const db = new sqlite3.Database(dbPath);

type StatementParams = unknown[] | { [key: string]: unknown };

export function run(sql: string, params: StatementParams = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function get<T>(sql: string, params: StatementParams = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
}

export function all<T>(sql: string, params: StatementParams = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

export async function initializeSchema() {
  await run(`CREATE TABLE IF NOT EXISTS access_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application TEXT NOT NULL,
    reviewer TEXT NOT NULL,
    status TEXT NOT NULL,
    due_date TEXT NOT NULL,
    owner_role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    changes TEXT,
    created_at TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    business_unit TEXT NOT NULL,
    service_line TEXT,
    data_classification TEXT,
    criticality TEXT,
    hosting_model TEXT,
    owner TEXT,
    it_owner TEXT,
    compliance_scope TEXT,
    recovery_objective TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
}
