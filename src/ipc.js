const path = require('path');
const fs = require('fs-extra');
import { app, ipcMain } from 'electron'

export function initIPC(win) {
  /**
    Electron IPC
  **/
  ipcMain.on('minimize-window', (event) => {
    win.minimize();
  });

  ipcMain.on('maximize-window', (event) => {
    if (win.isMaximized()) {
      win.restore();
    } else {
      win.maximize();
    }
  });

  ipcMain.on('close-window', (event) => {
    win.close();
  });

  // Read file and send data back to renderer
  ipcMain.handle('read-file', async (event, type, filePath) => {
    const newPath = path.join(getFileBasePath(type), filePath);

    const exists = await fs.pathExists(newPath);
    if (exists) {
      return await fs.readFile(newPath, { encoding: 'utf8' });
    } else {
      return null;
    }
  });

  // Write file
  ipcMain.handle('write-file', async (event, type, filePath, data) => {
    const newPath = path.join(getFileBasePath(type), filePath);
    console.log(newPath)
    await fs.ensureFile(newPath);

    await fs.writeFile(newPath, data, { flag: 'w' });
  });
};

function getFileBasePath(type) {
  if (type === 'config' || type === 'token') {
    return path.join(app.getPath('userData'), 'config');
  } else if (type === 'output') {
    return path.join(app.getPath('documents'), 'enhancify');
  }
}