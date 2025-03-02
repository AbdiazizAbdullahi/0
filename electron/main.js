const { app, BrowserWindow, ipcMain, protocol, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { setupDatabase } = require('./database');
const setupIpcHandlers = require("./ipcHandlers")
const dotenv = require('dotenv');

// Load environment variables
if (app.isPackaged) {
  dotenv.config({ path: path.join(process.resourcesPath, '.env') });
} else {
  dotenv.config();
}

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

autoUpdater.on("update-available", (_event, releaseNotes, releaseName) => {
  const dialogOpts = {
     type: 'info',
     buttons: ['Ok'],
     title: 'Update Available',
     message: process.platform === 'win32' ? releaseNotes : releaseName,
     detail: 'A new version download started. The app will be restarted to install the update.'
  };
  dialog.showMessageBox(dialogOpts);
});

autoUpdater.on("update-downloaded", async (_event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  };
  try {
    const returnValue = await dialog.showMessageBox(dialogOpts);
    if (returnValue.response === 0) {
      // Prepare for update
      await prepareForUpdate();
      // Wait a bit to ensure everything is closed properly
      setTimeout(() => {
        autoUpdater.quitAndInstall(false, true);
      }, 2000);
    }
  } catch (error) {
    autoUpdater.logger.error('Error during update process:', error);
  }
});

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'debug';

// Ensure proper permissions for auto-updater
function ensureAutoUpdaterPermissions() {
  const appUpdateDir = path.join(app.getPath('userData'), 'update');
  try {
    if (!fs.existsSync(appUpdateDir)) {
      fs.mkdirSync(appUpdateDir, { recursive: true });
    }
    fs.accessSync(appUpdateDir, fs.constants.W_OK);
    
    // Grant full control to Users group
    if (process.platform === 'win32') {
      execSync(`icacls "${appUpdateDir}" /grant Users:F /T`);
    }
  } catch (err) {
    autoUpdater.logger.error('Error ensuring auto-updater permissions:', err);
    dialog.showErrorBox('Update Error', 'Unable to access the update directory. Please run the application as an administrator.');
  }
}

function prepareForUpdate() {
  return new Promise(async (resolve) => {
    // Close all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.close();
    });

    // Close PouchDB
    if (db) {
      try {
        await db.close();
        console.log("PouchDB closed successfully");
      } catch (err) {
        console.error("Error closing PouchDB:", err);
      }
    }

    // Set a flag to prevent the app from restarting
    app.isQuitting = true;
    resolve();
  });
}

app.on("ready", async () => {
  try {
    ensureAutoUpdaterPermissions();
    createWindow();

    db = setupDatabase();
    console.log("PouchDB opened successfully");

    setupIpcHandlers(ipcMain, db, mainWindow);

    // Check for updates on app start
    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    }
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
