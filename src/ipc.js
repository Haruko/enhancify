const path = require('path');
const fs = require('fs-extra');
import { app, ipcMain, shell } from 'electron'

export function initIPC(win) {
  /**
    Send actions
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

  ipcMain.on('open-directory', async (event, type, file) => {
    const dirPath = getFileBasePath(type);
    
    await fs.ensureDir(dirPath);
    
    if (typeof file !== 'undefined') {
      await shell.showItemInFolder(path.join(dirPath, file));
    } else {
      await shell.openPath(dirPath);
    }
  });

  /**
    Invoke-able actions
  **/
  // Read file and send data back to renderer
  ipcMain.handle('read-file', async (event, type, filePath) => {
    const newPath = path.join(getFileBasePath(type), filePath);
    console.log('read', newPath);

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
    console.log('write', newPath);

    await fs.ensureFile(newPath);
    await fs.writeFile(newPath, data, { flag: 'w' });
  });

  // Delete file
  ipcMain.handle('delete-file', async (event, type, filePath) => {
    const newPath = path.join(getFileBasePath(type), filePath);
    console.log('delete', newPath);

    await fs.remove(newPath);
  });
};

function getFileBasePath(type) {
  if (type === 'config' || type === 'token') {
    return path.join(app.getPath('userData'), 'config');
  } else if (type === 'output') {
    return path.join(app.getPath('documents'), 'enhancify');
  }
}