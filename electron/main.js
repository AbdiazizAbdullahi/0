const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const { setupDatabase } = require('./database');
const setupIpcHandlers = require("./ipcHandlers")

// Register custom protocol before any app initialization
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

let mainWindow;
let serve;
let db;

// Disable hardware acceleration
app.disableHardwareAcceleration();

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
  });

  if (app.isPackaged) {
    if (serve) {
      serve(mainWindow).then(() => {
        mainWindow.loadURL('app://-');
      })
      .catch(console.error);
    } else {
      console.error('Serve function not initialized');
    }
  } else {
    mainWindow.loadURL('http://localhost:3333');
    mainWindow.webContents.on("did-fail-load", () => {
      setTimeout(() => {
        mainWindow.webContents.reloadIgnoringCache();
      }, 3000);
    });
  }
};

app.whenReady().then(async () => {
  // Initialize serve function if in packaged mode
  if (app.isPackaged) {
    try {
      const { default: serveFunc } = await import('electron-serve');
      serve = serveFunc({
        directory: path.join(__dirname, '../out'),
      });
    } catch (error) {
      console.error('Failed to initialize electron-serve:', error);
    }
  }

  db = setupDatabase();
  createWindow();

  setupIpcHandlers(ipcMain, db, mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
