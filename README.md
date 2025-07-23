# AccessRemote (Electron)

Una aplicación para interactuar con la API de TailScale y controlar dispositivos Android remotamente.

## Características

- Ver los dispositivos conectados a tu red TailScale
- Hacer ping a los dispositivos para comprobar su disponibilidad
- Conectarse de forma remota a dispositivos Android utilizando `scrcpy` y `adb`
- Visualizar archivos de dispositivos Android

## Requisitos

- [Cuenta de TailScale](https://tailscale.com/)
- Cliente de TailScale instalado en tu sistema
- Los binarios de `scrcpy` y `adb` deben estar en la carpeta `resources/scrcpy/` para poder usar la funcionalidad de control remoto

## Desarrollo

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
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
3. Colocar los binarios de `adb` y `scrcpy` en la carpeta `resources/scrcpy/`

## Configuración de ADB y scrcpy

Para que la aplicación funcione correctamente:

1. Descarga [scrcpy](https://github.com/Genymobile/scrcpy/releases) para tu sistema operativo
2. Coloca los archivos `adb.exe`, `scrcpy.exe` y las DLLs relacionadas en la carpeta `resources/scrcpy/`
3. Asegúrate de que los dispositivos Android tengan activado el modo depuración y permitido el acceso ADB por red (puerto 5555)

## Licencia

MIT

## Autor

Anthonyzok521
