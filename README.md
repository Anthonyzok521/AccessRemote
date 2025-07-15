# AccessRemote

Este proyecto permite interactuar con la API de TailScale para:

- Ver los dispositivos conectados a tu red TailScale.
- Hacer ping a los dispositivos para comprobar su disponibilidad.
- Conectarse de forma remota a dispositivos Android utilizando `scrcpy` y `adb`.

## Desarrollo

Ejecuta el entorno usando:
```ps
.\use-venv.bat
```
o
```shell
./use-venv
```

Compilar a .exe
```shell
pyinstaller --name AccessRemote --onefile --noconsole --icon=icon.ico main.py
```

## Requisitos

- Cuenta en [TailScale](https://tailscale.com/)
- Programa de TailSacle instalado

## Funcionalidades

1. **Listar dispositivos**: Consulta todos los dispositivos conectados a tu red TailScale.
2. **Ping**: Verifica la conectividad con cualquier dispositivo de la red.
3. **Conexión remota a Android**: Usa `adb` y `scrcpy` para controlar dispositivos Android conectados a TailScale.

## Uso

1. Configura tu token de TailScale.
2. Ejecuta el proyecto para listar y seleccionar dispositivos.
3. Realiza ping o conéctate a dispositivos Android según sea necesario.

## Licencia

MIT

## Autor
[@Anthonyzok521](https://github.com/Anthonyzok521)