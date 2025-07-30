# AccessRemote (Electron)

Una aplicación para interactuar con la API de TailScale y controlar dispositivos Android remotamente.

## Características

- Ver los dispositivos conectados a tu red TailScale
- Hacer ping a los dispositivos para comprobar su disponibilidad
- Conectarse de forma remota a dispositivos Android utilizando `scrcpy` y `adb`
- Visualizar archivos de dispositivos Android
- Funcionalidad de bandeja del sistema (System Tray) - la aplicación se mantiene en segundo plano al cerrar la ventana
- Menú contextual en la bandeja del sistema para abrir o cerrar completamente la aplicación

## Requisitos

- [Cuenta de TailScale](https://tailscale.com/)
- Cliente de TailScale instalado en tu sistema
- `scrcpy` y `adb` deben estar instalados y agregados como variables de entorno en el sistema.

## Desarrollo

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo producción
npm run start
```

### Compilación

```bash
# Construir para Windows
npm run build:win

# Construir para Mac
npm run build:mac

# Construir para Linux
npm run build:linux
```

## Preparación del entorno

Antes de ejecutar o compilar la aplicación, asegúrate de:

1. Tener instalado [Node.js](https://nodejs.org/) (versión 14 o superior)
2. Tener instalado [TailScale](https://tailscale.com/download)
3. Instalar y configurar `scrcpy` y `adb` como variables de entorno:

### Instalación de ADB y scrcpy

#### En Windows:
1. Descarga [Platform Tools](https://developer.android.com/studio/releases/platform-tools) (contiene adb)
2. Descarga [scrcpy](https://github.com/Genymobile/scrcpy/releases) para Windows
3. Extrae ambos archivos en carpetas separadas (ej: `C:\adb` y `C:\scrcpy`)
4. Agrega ambas rutas al PATH del sistema:
   - Presiona `Win + R`, escribe `sysdm.cpl` y presiona Enter
   - Ve a la pestaña "Avanzado" → "Variables de entorno"
   - Edita la variable "Path" del sistema y agrega las rutas de adb y scrcpy

#### En macOS:
```bash
# Usando Homebrew
brew install android-platform-tools
brew install scrcpy
```

#### En Linux:
```bash
# Ubuntu/Debian
sudo apt install adb scrcpy

# Arch Linux
sudo pacman -S android-tools scrcpy

# Fedora
sudo dnf install android-tools scrcpy
```

### Verificación de instalación
Puedes verificar que todo esté correctamente instalado ejecutando:
```bash
adb version
scrcpy --version
```

### Configuración de dispositivos Android
Asegúrate de que los dispositivos Android tengan:
- Modo de desarrollador activado
- Depuración USB habilitada
- Depuración inalámbrica habilitada (Android 11+) o ADB por TCP en puerto 5555

### Ícono de la aplicación
La aplicación usa los siguientes íconos:
- `assets/icon.ico`: Para la ventana principal (formato Windows nativo)
- `assets/icon.png`: Para la bandeja del sistema (mejor compatibilidad)

Ambos archivos deben representar el mismo ícono en diferentes formatos.

## Uso de la bandeja del sistema

Cuando ejecutes la aplicación:
- Al hacer clic en el botón "cerrar" de la ventana, la aplicación se ocultará y permanecerá en la bandeja del sistema
- Puedes hacer clic izquierdo en el ícono de la bandeja para mostrar la ventana nuevamente
- Haz clic derecho en el ícono de la bandeja para ver el menú contextual con opciones para:
  - **Abrir**: Mostrar la ventana de la aplicación
  - **Cerrar**: Cerrar completamente la aplicación


## Licencia

MIT

## Autor

Anthonyzok521
