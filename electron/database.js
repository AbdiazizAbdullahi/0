const PouchDB = require("pouchdb");
const { app } = require('electron');
const path = require('path');
PouchDB.plugin(require("pouchdb-find"));

let db;

function setupDatabase() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'Database');
    db = new PouchDB(dbPath, { auto_compaction: true });
  }
  return db;
}

function getDatabase() {
  return db;
}

module.exports = {
  setupDatabase,
  getDatabase
};
