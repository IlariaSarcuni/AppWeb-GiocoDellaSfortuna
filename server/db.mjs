import sqlite from 'sqlite3';

// apre il database
const db = new sqlite.Database('stuffhappens.sqlite', (err) => {
  if (err) throw err;
});

export default db;