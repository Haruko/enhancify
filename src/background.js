'use strict'

import { app, protocol, BrowserWindow, globalShortcut, Tray, Menu, ipcMain } from 'electron';
import { initIPC } from './ipc.js';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
const commandExists = require('command-exists');
const path = require('path');

const isDevelopment = process.env.NODE_ENV !== 'production';

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const iconPath = isDevelopment ? 'public/icon-256x256.png' :
  path.join(__dirname, 'icon-256x256.png');

let win;

let tray,
  trayMenu,
  isLoggedIn = false,
  isStarted = false;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
  const width = 800;
  const height = 600;

  // Create the browser window.
  win = new BrowserWindow({
    icon: iconPath,
    width: 800,
    height: 600,
    frame: false,
    backgroundColor: '#202227',
    // backgroundColor: '#121212',
    show: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      devTools: isDevelopment,
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);

    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }

  win.once('ready-to-show', async () => {
    const desktopExists = await commandExists('spotify');

    win.once('show', async () => {
      win.webContents.send('window-resize', width, height);

      if (!desktopExists) {
        win.webContents.send('disable-desktop');
      }
    });

    win.show();
  });

  win.on('closed', () => {
    win = null
  });

  // win.on('will-resize', (event, newBounds) => onWindowResize(win, newBounds.width, newBounds.height));
  win.on('resize', (event) => onWindowResize(win));
  win.on('maximize', (event) => onWindowResize(win));
  win.on('unmaximize', (event) => onWindowResize(win));

  win.on('will-quit', (event) => globalShortcut.unregisterAll());

  initTray();
  initIPC(win);
}

function onWindowResize(context, width, height) {
  if (typeof width === 'undefined' || typeof height === 'undefined') {
    // Assume BrowserWindow object
    const bounds = context.getBounds();
    width = bounds.width;
    height = bounds.height;
  }

  // Send IPC message to renderer to be consumed by components
  win.webContents.send('window-resize', width, height, win.isMaximized());
}

function initTray() {
  createTray();
  createTrayMenu(true);

  // Window state
  win.on('minimize', (event) => {
    event.preventDefault();
    win.hide();
    createTrayMenu();
  });

  // Tray IPC
  ipcMain.on('tray-login', () => {
    isLoggedIn = true;
    isStarted = false;
    createTrayMenu();
  });

  ipcMain.on('tray-logout', () => {
    isLoggedIn = false;
    isStarted = false;
    createTrayMenu();
  });

  ipcMain.on('tray-start', () => {
    isStarted = true;
    createTrayMenu();
  });

  ipcMain.on('tray-stop', () => {
    isStarted = false;
    createTrayMenu();
  });
}

function createTray() {
  tray = new Tray(iconPath);
  tray.setToolTip('Enhancify');
  tray.on('double-click', () => {
    if (win.isVisible()) {
      win.focus();
    } else {
      win.show();
      createTrayMenu();
    }
  });
}

function createTrayMenu(newlyCreated) {
  // Start stop
  // Bookmark
  const menuItems = [];

  // Add logout option
  if (isLoggedIn) {
    menuItems.push({
      label: 'Log Out',
      click: () => win.webContents.send('tray-logout'),
    });

    // Add start/stop/bookmark options
    if (isStarted) {
      menuItems.push({
        label: 'Bookmark',
        click: () => win.webContents.send('tray-bookmark'),
      }, {
        label: 'Stop',
        click: () => win.webContents.send('tray-stop'),
      });
    } else {
      menuItems.push({
        label: 'Start',
        click: () => win.webContents.send('tray-start'),
      });
    }
  } else {
    menuItems.push({
      label: 'Log In',
      click: () => {
        win.webContents.send('tray-login');
        win.show();
        createTrayMenu();
      },
    });
  }

  menuItems.push({
    type: 'separator',
  }, {
    label: (newlyCreated || win.isVisible()) ? 'Hide' : 'Show',
    id: 'show-hide',
    click: toggleMinimizeToTray,
  }, {
    label: 'Quit',
    role: 'quit',
  });

  trayMenu = Menu.buildFromTemplate(menuItems);

  tray.setContextMenu(trayMenu);
}

function toggleMinimizeToTray() {
  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
  }

  createTrayMenu();
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {

    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  createWindow();
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    })
  }
}