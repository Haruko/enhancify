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

  ipcMain.on('open-directory', async (event, type) => {
    try {
      const dirPath = getFileBasePath(type);
      const filename = getFileName(type);

      await fs.ensureDir(dirPath);

      if (typeof filename !== 'undefined') {
        const filePath = path.join(dirPath, filename);
        const fileExists = await fs.pathExists(filePath);

        if (fileExists) {
          await shell.showItemInFolder(filePath);
        } else {
          await shell.openPath(dirPath);
        }
      } else {
        await shell.openPath(dirPath);
      }
    } catch (error) {
      console.log(error);
    }
  });

  ipcMain.on('open-file', async (event, type) => {
    const filePath = path.join(getFileBasePath(type), getFileName(type));

    await fs.ensureFile(filePath);
    await shell.openPath(filePath);
  });

  /**
    Invoke-able actions
  **/
  // Read file and send data back to renderer
  ipcMain.handle('read-file', async (event, type) => {
    const newPath = path.join(getFileBasePath(type), getFileName(type));
    console.log('read', newPath);

    const exists = await fs.pathExists(newPath);
    if (exists) {
      return await fs.readFile(newPath, { encoding: 'utf8' });
    } else {
      return null;
    }
  });

  // Write file
  ipcMain.handle('write-file', async (event, type, data) => {
    const newPath = path.join(getFileBasePath(type), getFileName(type));
    console.log('write', newPath);

    await fs.ensureFile(newPath);
    await fs.writeFile(newPath, data, { flag: 'w' });
  });

  // Delete file
  ipcMain.handle('delete-file', async (event, type) => {
    const newPath = path.join(getFileBasePath(type), getFileName(type));
    console.log('delete', newPath);

    await fs.remove(newPath);
  });
};

function getFileBasePath(type) {
  switch (type) {
    case 'config':
    case 'token':
      return path.join(app.getPath('userData'), 'config');
    case 'output':
    case 'bookmarks':
      return path.join(app.getPath('documents'), 'enhancify');
    default:
      return undefined;
  };
}

function getFileName(type) {
  switch (type) {
    case 'config':
      return 'config.json';
    case 'token':
      return 'refresh.token';
    case 'bookmarks':
      return 'bookmarks.csv';
    default:
      return undefined;
  };
}