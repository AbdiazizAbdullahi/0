const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const { setupDatabase } = require('./database');
const setupIpcHandlers = require("./ipcHandlers")

let mainWindow;
let serve;
let db;

// Disable hardware acceleration
app.disableHardwareAcceleration();

// Register protocol before app is ready
// protocol.registerSchemesAsPrivileged([
//   { scheme: 'app', privileges: { secure: true, standard: true } }
// ]);

// Initialize serve function if in packaged mode
if (app.isPackaged) {
  (async () => {
    const {default: serveFunc} = await import('electron-serve');
    serve = serveFunc({
      directory: path.join(__dirname, '../out'),
    });

    protocol.registerSchemesAsPrivileged([
      { scheme: "app", privileges: { secure: true, standard: true } },
    ]);
  })();
}

const createWindow = () => {
    mainWindow = new BrowserWindow({
      fullscreen: false,
      frame: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      },
    });

    mainWindow.maximize();

    mainWindow.once("ready-to-show", () => {
      if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
      }
    });

    if (app.isPackaged) {
      serve(mainWindow)
      .then(() => {
        mainWindow.loadURL("app://-");
      })
      .catch(console.error);
  } else {
    mainWindow.loadURL("http://localhost:3333");
    mainWindow.webContents.on("did-fail-load", () => {
      mainWindow.webContents.reloadIgnoringCache();
    });
  }
};

app.on("ready", async () => {
  try {
    createWindow();

    db = setupDatabase();
    console.log("PouchDB opened successfully");

    setupIpcHandlers(ipcMain, db, mainWindow);

  } catch (error) {
    console.error("Failed to open PouchDB:", error);
    app.quit();
  }
});

// app.whenReady().then(async () => {
//   try {
//     db = setupDatabase();
//     createWindow();
//     setupIpcHandlers(ipcMain, db, mainWindow);
//   } catch (error) {
//     console.error('Error in app initialization:', error);
//   }
// });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !app.isQuitting) {
    app.quit();
  }
});

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

app.on("before-quit", async (event) => {
  if (!app.isQuitting) {
    event.preventDefault();

    if (db && !db.isClosed) {
      console.log("Closing PouchDB...");
      db.close();
    }

    console.log("PouchDB closed. Quitting app...");
    app.exit(0);
  }
});
