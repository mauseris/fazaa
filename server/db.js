// ============================================================================
// تخزين الجلسات — SQLite حقيقي (better-sqlite3) مع رجوع تلقائي لملف JSON بسيط
// إن تعذّر تحميل الوحدة الأصلية (native module) على جهاز معيّن — عشان العرض
// أمام اللجنة ما ينهار أبداً بسبب مشكلة تثبيت على جهاز غير معروف.
// ============================================================================

const path = require("path");
const fs = require("fs");

let Database = null;
try{
  Database = require("better-sqlite3");
}catch(e){
  Database = null;
}

const SQLITE_PATH = path.join(__dirname, "fazaa.db");
const JSON_FALLBACK_PATH = path.join(__dirname, "data.json");

let db = null;
let usingSqlite = false;

function init(){
  if (Database){
    try{
      db = new Database(SQLITE_PATH);
      db.pragma("journal_mode = WAL");
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      usingSqlite = true;
      console.log("✅ التخزين: SQLite (server/fazaa.db)");
      return;
    }catch(e){
      console.warn(`⚠️  تعذّر تشغيل SQLite (${e.message}) — الرجوع لتخزين JSON بسيط.`);
    }
  } else {
    console.warn("⚠️  حزمة better-sqlite3 غير مثبتة على هذا الجهاز — الرجوع لتخزين JSON بسيط.");
  }
  usingSqlite = false;
}

function readJsonAll(){
  try{ return JSON.parse(fs.readFileSync(JSON_FALLBACK_PATH, "utf8")); }
  catch(e){ return {}; }
}
function writeJsonAll(obj){
  fs.writeFileSync(JSON_FALLBACK_PATH, JSON.stringify(obj, null, 2), "utf8");
}

function get(id){
  if (usingSqlite){
    const row = db.prepare("SELECT value FROM sessions WHERE id = ?").get(id);
    return row ? JSON.parse(row.value) : undefined;
  }
  return readJsonAll()[id];
}

function set(id, value){
  if (usingSqlite){
    db.prepare(`
      INSERT INTO sessions (id, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(id, JSON.stringify(value), Date.now());
    return;
  }
  const all = readJsonAll();
  all[id] = value;
  writeJsonAll(all);
}

function remove(id){
  if (usingSqlite){
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return;
  }
  const all = readJsonAll();
  delete all[id];
  writeJsonAll(all);
}

module.exports = { init, get, set, remove, isSqlite: () => usingSqlite };
