const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;

// Prevenir multiples instancias de la app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Si alguien intenta abrir una segunda instancia, se enfoca la ventana principal
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  function createWindow () {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: false, // Permitir acceso a módulos nativos en preload
        devTools: process.env.NODE_ENV === 'development' || process.argv.includes('--dev-tools')
      },
      // Usar .ico para la ventana principal en Windows
      icon: path.join(__dirname, 'assets/icon.ico')
    });

    // Abrir las herramientas de desarrollo en modo de desarrollo
    if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev-tools')) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile('index.html');

    // Ocultar la ventana en lugar de cerrarla
    mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
      }
      return false;
    });
  }

  const createTray = () => {
    // Usar .png para la bandeja del sistema (más compatible)
    const iconPath = path.join(__dirname, 'assets/icon.png');
    tray = new Tray(iconPath);
    tray.setToolTip('AccessRemote');

    // Clic izquierdo para mostrar/ocultar la ventana
    tray.on('click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });

    // Clic derecho para mostrar el menú contextual
    tray.on('right-click', () => {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Abrir',
          click: () => {
            mainWindow.show();
          }
        },
        {
          label: 'Cerrar',
          click: () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]);
      tray.popUpContextMenu(contextMenu);
    });
  }

  app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('before-quit', () => {
    app.isQuitting = true;
  });

  app.on('window-all-closed', () => {
    // En macOS es común que las aplicaciones se mantengan activas hasta que se cierren explícitamente
    // En otras plataformas, queremos que la app se mantenga en la bandeja del sistema, así que no hacemos nada.
    if (process.platform !== 'darwin') {
      // No hacer nada, la aplicación permanecerá en la bandeja
    }
  });
}

