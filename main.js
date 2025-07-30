const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false, // Permitir acceso a módulos nativos en preload
      devTools: process.env.NODE_ENV === 'development' || process.argv.includes('--dev-tools')
    }
  });
  
  // Solo abrir las herramientas de desarrollo en modo desarrollo
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev-tools')) {
    win.webContents.openDevTools();
  }

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

