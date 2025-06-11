import sqlite from 'sqlite3';

// apre il database
export const db = new sqlite.Database('db.sqlite', (err) => {
  if (err) throw err;
});