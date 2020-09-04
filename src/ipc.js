const path = require('path');
const fs = require('fs-extra');
const json5 = require('json5');
const download = require('download');

import { app, ipcMain, shell, globalShortcut } from 'electron'

import config from 'json5-loader!./config.json5';

const keycodeMappings = {
  Digit0: '0',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',

  KeyA: 'A',
  KeyB: 'B',
  KeyC: 'C',
  KeyD: 'D',
  KeyE: 'E',
  KeyF: 'F',
  KeyG: 'G',
  KeyH: 'H',
  KeyI: 'I',
  KeyJ: 'J',
  KeyK: 'K',
  KeyL: 'L',
  KeyM: 'M',
  KeyN: 'N',
  KeyO: 'O',
  KeyP: 'P',
  KeyQ: 'Q',
  KeyR: 'R',
  KeyS: 'S',
  KeyT: 'T',
  KeyU: 'U',
  KeyV: 'V',
  KeyW: 'W',
  KeyX: 'X',
  KeyY: 'Y',
  KeyZ: 'Z',

  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
  F13: 'F13',
  F14: 'F14',
  F15: 'F15',
  F16: 'F16',
  F17: 'F17',
  F18: 'F18',
  F19: 'F19',
  F20: 'F20',
  F21: 'F21',
  F22: 'F22',
  F23: 'F23',
  F24: 'F24',

  //   : 'Plus',
  Space: 'Space',
  Tab: 'Tab',
  Capslock: 'Capslock',
  Numlock: 'Numlock',
  Scrolllock: 'Scrolllock',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  Enter: 'Enter',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Escape: 'Esc',
  PrintScreen: 'PrintScreen',

  Numpad0: 'num0',
  Numpad1: 'num1',
  Numpad2: 'num2',
  Numpad3: 'num3',
  Numpad4: 'num4',
  Numpad5: 'num5',
  Numpad6: 'num6',
  Numpad7: 'num7',
  Numpad8: 'num8',
  Numpad9: 'num9',
  NumpadDecimal: 'numdec',
  NumpadAdd: 'numadd',
  NumpadSubtract: 'numsub',
  NumpadMultiply: 'nummult',
  NumpadDivide: 'numdiv',
  NumpadEnter: 'Enter',

  // Figured out ones
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  Pause: 'Pause',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: '\'',
  Comma: ',',
  Period: '.',
  Slash: '/',
};


export function initIPC(win) {
  // Window controls
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



  // Files
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

  ipcMain.handle('write-file', async (event, type, data, filename) => {
    const filePath = path.join(getFileBasePath(type), typeof filename !== 'undefined' ? filename : getFileName(type));
    console.log('write', filePath);

    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, data, { flag: 'w' });
  });

  ipcMain.handle('delete-file', async (event, type, filename) => {
    const filePath = path.join(getFileBasePath(type), typeof filename !== 'undefined' ? filename : getFileName(type));
    console.log('delete', filePath);

    await fs.remove(filePath);
  });

  ipcMain.handle('download-file', async (event, url, type, filename) => {
    if (typeof filename === 'undefined') {
      filename = getFileName(type);
    }

    console.log('download', url);

    await download(url, getFileBasePath(type), { filename: filename });
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



  // Hotkeys
  ipcMain.on('register-hotkey-start', async (event) => {
    event.sender.on('before-input-event', handleInputEvent);
  });

  ipcMain.on('register-hotkey-stop', async (event) => {
    event.sender.off('before-input-event', handleInputEvent);
  });

  ipcMain.on('load-hotkey', async (event, hotkey) => {
    globalShortcut.unregisterAll();
    globalShortcut.register(hotkey, () => {
      event.sender.send('hotkey-pressed');
    });
  });
}

function handleInputEvent(event, input) {
  if ([
      'Command', 'Control',
      'Alt', 'AltGr',
      'Option',
      'Shift',
      'Meta', 'Super',
      'ContextMenu',
      'VolumeUp', 'VolumeDown', 'VolumeMute',
      'MediaNextTrack', 'MediaPreviousTrack', 'MediaStop', 'MediaPlayPause'
    ].indexOf(input.key) !== -1) {
    return;
  }

  // Map keys to usable accelerator
  const acceleratorKeys = [];
  if (input.control) {
    acceleratorKeys.push('CommandOrControl');
  }

  if (input.alt) {
    acceleratorKeys.push('Alt');
  }

  if (input.shift) {
    acceleratorKeys.push('Shift');
  }

  acceleratorKeys.push(keycodeMappings[input.code]);
  const acceleratorString = acceleratorKeys.join('+');

  globalShortcut.unregisterAll();
  globalShortcut.register(acceleratorString, () => {
    event.sender.send('hotkey-pressed');
  });

  event.sender.send('register-hotkey-captured', acceleratorString);
  event.sender.off('before-input-event', handleInputEvent);
}

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