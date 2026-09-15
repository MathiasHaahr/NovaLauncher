const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron');

const path = require('path');
const fs = require('fs');

const {
  adapter
} = require('../adapter/xmcl-adapter');

let mainWindow = null;
let novaInitialized = false;

function createWindow() {
  const preloadPath = path.resolve(
    __dirname,
    '..',
    'preload',
    'preload.js'
  );

  const uiPath = path.resolve(
    __dirname,
    '..',
    'ui',
    'index.html'
  );

  console.log('[NOVA] Creating main window');
  console.log('[NOVA] __dirname:', __dirname);
  console.log('[NOVA] Preload path:', preloadPath);
  console.log(
    '[NOVA] Preload exists:',
    fs.existsSync(preloadPath)
  );
  console.log('[NOVA] UI path:', uiPath);
  console.log(
    '[NOVA] UI exists:',
    fs.existsSync(uiPath)
  );
  console.log(
    '[NOVA] Electron version:',
    process.versions.electron
  );

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,

    minWidth: 1000,
    minHeight: 650,

    backgroundColor: '#07090f',

    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.webContents.on(
    'preload-error',
    (event, preloadPath, error) => {
      console.error(
        '[NOVA PRELOAD ERROR]'
      );

      console.error(
        'Path:',
        preloadPath
      );

      console.error(
        'Error:',
        error
      );
    }
  );

  mainWindow.webContents.on(
    'did-fail-load',
    (
      event,
      errorCode,
      errorDescription,
      validatedURL
    ) => {
      console.error(
        '[NOVA UI ERROR] Failed to load UI'
      );

      console.error(
        'Error code:',
        errorCode
      );

      console.error(
        'Description:',
        errorDescription
      );

      console.error(
        'URL:',
        validatedURL
      );
    }
  );

  mainWindow.webContents.on(
    'console-message',
    (event, level, message) => {
      console.log(
        `[NOVA UI] ${message}`
      );
    }
  );

  mainWindow.on(
    'closed',
    () => {
      mainWindow = null;
    }
  );

  mainWindow.loadFile(uiPath);
}

/*
|--------------------------------------------------------------------------
| Runtime
|--------------------------------------------------------------------------
*/

ipcMain.handle(
  'nova.runtime.status',
  async () => {
    try {
      return await adapter.getRuntimeStatus();
    } catch (error) {
      console.error(
        '[NOVA IPC] Runtime status failed:',
        error
      );

      return {
        status: 'error',
        error: error.message
      };
    }
  }
);

/*
|--------------------------------------------------------------------------
| Accounts
|--------------------------------------------------------------------------
*/

ipcMain.handle(
  'nova.account.list',
  async () => {
    try {
      if (!adapter.getAccounts) {
        return [];
      }

      return await adapter.getAccounts();
    } catch (error) {
      console.error(
        '[NOVA IPC] Account list failed:',
        error
      );

      return [];
    }
  }
);

ipcMain.handle(
  'nova.account.active',
  async () => {
    try {
      if (!adapter.getActiveAccount) {
        return null;
      }

      return await adapter.getActiveAccount();
    } catch (error) {
      console.error(
        '[NOVA IPC] Active account failed:',
        error
      );

      return null;
    }
  }
);

ipcMain.handle(
  'nova.account.login',
  async () => {
    console.log(
      '[NOVA IPC] Microsoft login requested'
    );

    try {
      if (!adapter.loginMicrosoft) {
        return {
          status: 'blocked',
          reason:
            'Microsoft authentication is not initialized'
        };
      }

      return await adapter.loginMicrosoft();
    } catch (error) {
      console.error(
        '[NOVA IPC] Microsoft login failed:',
        error
      );

      return {
        status: 'error',
        error: error.message
      };
    }
  }
);

ipcMain.handle(
  'nova.account.logout',
  async (event, id) => {
    try {
      if (!adapter.logout) {
        return {
          status: 'not_implemented'
        };
      }

      return await adapter.logout(id);
    } catch (error) {
      console.error(
        '[NOVA IPC] Logout failed:',
        error
      );

      return {
        status: 'error',
        error: error.message
      };
    }
  }
);

ipcMain.handle(
  'nova.account.setActive',
  async (event, id) => {
    try {
      if (!adapter.setActiveAccount) {
        return {
          status: 'not_implemented'
        };
      }

      return await adapter.setActiveAccount(id);
    } catch (error) {
      console.error(
        '[NOVA IPC] Set active account failed:',
        error
      );

      return {
        status: 'error',
        error: error.message
      };
    }
  }
);

/*
|--------------------------------------------------------------------------
| Application lifecycle
|--------------------------------------------------------------------------
*/

app.whenReady().then(
  async () => {
    console.log('[NOVA] App ready');

    try {
      const result =
        await adapter.initialize();

      console.log(
        '[NOVA] Adapter initialization:',
        result
      );

      novaInitialized =
        result?.status === 'ready';

      createWindow();
    } catch (error) {
      console.error(
        '[NOVA] Initialization failed:',
        error
      );

      novaInitialized = false;

      createWindow();
    }
  }
);

app.on(
  'window-all-closed',
  () => {
    /*
     * Nova is currently desktop-first.
     * On Windows/Linux, close the application
     * when the final window is closed.
     */
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
);

app.on(
  'activate',
  () => {
    if (
      BrowserWindow.getAllWindows().length === 0
    ) {
      createWindow();
    }
  }
);

process.on(
  'uncaughtException',
  (error) => {
    console.error(
      '[NOVA] Uncaught exception:',
      error
    );
  }
);

process.on(
  'unhandledRejection',
  (reason) => {
    console.error(
      '[NOVA] Unhandled rejection:',
      reason
    );
  }
);