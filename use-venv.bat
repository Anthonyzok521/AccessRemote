@echo off
REM Script para activar entorno virtual de Python en Windows

IF NOT EXIST "venv\" (
    echo El entorno virtual no existe. Creandolo...
    python -m venv venv
)

echo Activando el entorno virtual...
call venv\Scripts\activate