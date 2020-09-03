const path = require('path');
const fs = require('fs-extra');
const json5 = require('json5');
const download = require('download');

import { app, ipcMain, shell } from 'electron'

import config from 'json5-loader!./config.json5';

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
  });

  ipcMain.on('open-file', async (event, type, filename) => {
    const filePath = path.join(getFileBasePath(type), typeof filename !== 'undefined' ? filename : getFileName(type));

    await fs.ensureFile(filePath);
    await shell.openPath(filePath);
  });

  /**
    Invoke-able actions
  **/
  // Read file and send data back to renderer
  ipcMain.handle('read-file', async (event, type, filename) => {
    const filePath = path.join(getFileBasePath(type), typeof filename !== 'undefined' ? filename : getFileName(type));
    console.log('read', filePath);

    const exists = await fs.pathExists(filePath);
    if (exists) {
      return await fs.readFile(filePath, { encoding: 'utf8' });
    } else {
      return null;
    }
  });

  // Write file
  ipcMain.handle('write-file', async (event, type, data, filename) => {
    const filePath = path.join(getFileBasePath(type), typeof filename !== 'undefined' ? filename : getFileName(type));
    console.log('write', filePath);

    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, data, { flag: 'w' });
  });

  // Delete file
  ipcMain.handle('delete-file', async (event, type, filename) => {
    const filePath = path.join(getFileBasePath(type), typeof filename !== 'undefined' ? filename : getFileName(type));
    console.log('delete', filePath);

    await fs.remove(filePath);
  });

  // Download file
  ipcMain.handle('download-file', async (event, url, type, filename) => {
    if (typeof filename === 'undefined') {
      filename = getFileName(type);
    }
    
    console.log('download', url);
    
    await download(url, getFileBasePath(type), { filename: filename });
  });
};

function getFileBasePath(type) {
  const filesystemConfig = config.filesystem[type];

  if (typeof filesystemConfig !== 'undefined') {
    return path.join(app.getPath(filesystemConfig.pathBase), filesystemConfig.directory);
  } else {
    return undefined;
  }
}

function getFileName(type) {
  const filesystemConfig = config.filesystem[type];

  if (typeof filesystemConfig !== 'undefined') {
    const filename = filesystemConfig.filename
    return filename === null ? undefined : filename;
  } else {
    return undefined;
  }
}