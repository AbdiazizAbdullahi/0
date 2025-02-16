const PouchDB = require("pouchdb");
PouchDB.plugin(require("pouchdb-find"));

let db;

function setupDatabase() {
  if (!db) {
  db = new PouchDB('my_database', { auto_compaction: true });
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
