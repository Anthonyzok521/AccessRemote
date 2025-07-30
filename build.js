const builder = require('electron-builder');
const path = require('path');

// Establecer NODE_ENV para producción
process.env.NODE_ENV = 'production';

// Configuración para compilación
const config = {
  appId: 'com.advancedcommunity.accessremote',
  productName: 'AccessRemote',
  directories: {
    output: 'dist'
  },
  files: [
    '**/*',
    '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!**/node_modules/*.d.ts',
    '!**/node_modules/.bin',
    '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
    '!.editorconfig',
    '!**/._*',
    '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
    '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
    '!**/{appveyor.yml,.travis.yml,circle.yml}',
    '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}'
  ],
  extraResources: [
    {
      from: 'resources',
      to: 'resources'
    }
  ],
  win: {
    target: ['nsis'],
    icon: 'icon.ico'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  },
  mac: {
    target: ['dmg'],
    icon: 'icon.icns'
  },
  linux: {
    target: ['AppImage'],
    icon: 'icon.png'
  }
};

// Iniciar compilación
builder.build({
  config: config,
  targets: builder.Platform.current().createTarget()
})
.then(() => {
  console.log('Build completed successfully!');
})
.catch((error) => {
  console.error('Error during build:', error);
});
