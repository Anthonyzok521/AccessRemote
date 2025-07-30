document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const deviceTableBody = document.getElementById('deviceTableBody');
    const connectBtn = document.getElementById('connectBtn');
    const adbShellBtn = document.getElementById('adbShellBtn');
    const pingBtn = document.getElementById('pingBtn');
    const listFilesBtn = document.getElementById('listFilesBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const filterInput = document.getElementById('filterInput');
    const sortableHeaders = document.querySelectorAll('.sortable');
    
    // Referencias a los modales (sin inicializar todavía)
    const pingModalElement = document.getElementById('pingModal');
    const filesModalElement = document.getElementById('filesModal');
    const fileContentModalElement = document.getElementById('fileContentModal');
    const openDashboard = document.querySelector('#openDashboardBtn');
    
    // Inicialización diferida de modales
    let pingModal, filesModal, fileContentModal;
    
    // Verificar que bootstrap esté disponible
    if (typeof bootstrap !== 'undefined') {
        console.log('Bootstrap está disponible, inicializando modales');
        initModals();
    } else {
        console.error('Bootstrap no está disponible');       
    }
    
    function initModals() {
        try {
            pingModal = new bootstrap.Modal(pingModalElement);
            filesModal = new bootstrap.Modal(filesModalElement);
            fileContentModal = new bootstrap.Modal(fileContentModalElement);
        } catch (error) {
            console.error('Error al inicializar modales de Bootstrap:', error);
        }
    }

    // Variables de estado
    let selectedDevice = null;
    let allDevicesData = [];
    let currentSortColumn = 'ip';
    let currentSortDirection = 'asc';
    let deviceConnectionStatus = {};  // Mapa para almacenar el estado de conexión de cada dispositivo

    // Inicializar la aplicación
    loadDevices();

    // Event listeners
    refreshBtn.addEventListener('click', loadDevices);
    filterInput.addEventListener('input', filterDevices);
    
    // Event listeners para ordenamiento
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }
            
            // Remover clases de todas las cabeceras
            sortableHeaders.forEach(h => {
                h.classList.remove('asc', 'desc');
            });
            
            // Añadir clase a la cabecera actual
            header.classList.add(currentSortDirection);
            
            // Re-renderizar la tabla
            displayDevices(allDevicesData);
        });
    });

    function loadDevices() {
        toggleLoading(true, 'Cargando dispositivos...');
        window.api.getTailscaleDevices()
            .then(devices => {
                allDevicesData = devices;
                displayDevices(devices);
                toggleLoading(false);
            })
            .catch(error => {
                console.error('Error fetching devices:', error);
                toggleLoading(false);
                // Mostrar mensaje de error en la tabla
                deviceTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">
                            <div class="alert alert-danger">
                                Error al cargar dispositivos: ${error.message || 'Error desconocido'}
                            </div>
                        </td>
                    </tr>
                `;
            });
    }

    function displayDevices(devices) {
        // Filtrar dispositivos si hay texto en el filtro
        let filteredDevices = filterDevicesByText(devices);
        
        // Ordenar dispositivos
        filteredDevices = sortDevices(filteredDevices);
        
        // Limpiar tabla y mostrar dispositivos
        deviceTableBody.innerHTML = '';
        
        if (filteredDevices.length === 0) {
            deviceTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No se encontraron dispositivos</td>
                </tr>
            `;
            return;
        }
        
        filteredDevices.forEach(device => {
            const row = createDeviceRow(device);
            deviceTableBody.appendChild(row);
        });
    }
    
    function filterDevicesByText(devices) {
        const filterText = filterInput.value.toLowerCase().trim();
        if (!filterText) return devices;
        
        return devices.filter(device => 
            device.ip.toLowerCase().includes(filterText) ||
            device.name.toLowerCase().includes(filterText) ||
            device.os.toLowerCase().includes(filterText) ||
            device.status.toLowerCase().includes(filterText)
        );
    }
    
    function filterDevices() {
        displayDevices(allDevicesData);
    }
    
    function sortDevices(devices) {
        return [...devices].sort((a, b) => {
            let valA = a[currentSortColumn];
            let valB = b[currentSortColumn];
            
            // Si estamos ordenando por IP, usamos comparación de IP
            if (currentSortColumn === 'ip') {
                const ipA = a.ip.split('.').map(num => parseInt(num, 10));
                const ipB = b.ip.split('.').map(num => parseInt(num, 10));
                
                for (let i = 0; i < 4; i++) {
                    if (ipA[i] !== ipB[i]) {
                        return currentSortDirection === 'asc' ? ipA[i] - ipB[i] : ipB[i] - ipA[i];
                    }
                }
                return 0;
            } 
            
            // Comparación de cadenas para otros campos
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            
            if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function createDeviceRow(device) {
        const row = document.createElement('tr');
        row.classList.add('device-row');
        row.addEventListener('click', () => selectDevice(device, row));

        const ipCell = document.createElement('td');
        ipCell.textContent = device.ip;

        const nameCell = document.createElement('td');
        nameCell.textContent = device.name;

        const osCell = document.createElement('td');
        osCell.textContent = device.os;

        const statusCell = document.createElement('td');
        
        // Determinar el color del indicador de estado
        let statusClass = 'status-red';
        if (device.status === 'connected') {
            // Si tenemos información de ping, usarla
            if (deviceConnectionStatus[device.ip]) {
                const pingStatus = deviceConnectionStatus[device.ip];
                if (pingStatus.packetLoss < 25) {
                    statusClass = 'status-green';
                } else {
                    statusClass = 'status-yellow';
                }
            } else {
                statusClass = 'status-green';
            }
        }
        
        statusCell.innerHTML = `
            <span class="status-indicator ${statusClass}"></span>
            ${device.status}
        `;

        row.appendChild(ipCell);
        row.appendChild(nameCell);
        row.appendChild(osCell);
        row.appendChild(statusCell);

        return row;
    }

    function selectDevice(device, row) {
        if (selectedDevice === device) {
            row.classList.remove('selected-row');
            selectedDevice = null;
            setButtonsState(false);
        } else {
            clearPreviousSelection();
            row.classList.add('selected-row');
            selectedDevice = device;
            setButtonsState(true);
        }
    }

    function clearPreviousSelection() {
        const rows = deviceTableBody.getElementsByTagName('tr');
        for (const row of rows) {
            row.classList.remove('selected-row');
        }
    }

    function setButtonsState(enabled) {
        connectBtn.disabled = !enabled;
        adbShellBtn.disabled = !enabled;
        pingBtn.disabled = !enabled;
        listFilesBtn.disabled = !enabled;
    }

    connectBtn.addEventListener('click', () => {
        toggleLoading(true, 'Conectando ADB...');
        // Primero conectar ADB y luego lanzar scrcpy
        window.api.launchScrcpy(selectedDevice.ip)
            .then(() => {
                return window.api.launchScrcpy(selectedDevice.ip);
            })
            .then(() => {
                toggleLoading(false);
            })
            .catch(error => {
                console.error('Error connecting ADB:', error);
                toggleLoading(false);
            });
    });

    adbShellBtn.addEventListener('click', () => {
        window.api.openAdbShellRoot(selectedDevice.ip)
            .catch(error => console.error('Error opening ADB shell root:', error));
    });

    pingBtn.addEventListener('click', () => {
        toggleLoading(true, 'Realizando ping...');
        window.api.pingDevice(selectedDevice.ip)
            .then(result => {
                toggleLoading(false);
                displayPingResult(result);
            })
            .catch(error => {
                console.error('Error pinging device:', error);
                toggleLoading(false);
            });
    });

    listFilesBtn.addEventListener('click', () => {
        toggleLoading(true, 'Listando archivos...');
        window.api.listFiles(selectedDevice.ip)
            .then(result => {
                toggleLoading(false);
                displayFileList(result.files);
            })
            .catch(error => {
                console.error('Error listing files:', error);
                toggleLoading(false);
            });
    });

    function displayPingResult(result) {
        const pingOutput = document.getElementById('pingOutput');
        const pingStatus = document.getElementById('pingStatus');

        pingOutput.textContent = result.rawOutput;
        
        // Calcular porcentaje de pérdida de paquetes
        let packetLoss = 0;
        const packetLossMatch = result.rawOutput.match(/(\d+)% packet loss|Lost = (\d+)/i);
        if (packetLossMatch) {
            // Obtener el porcentaje o número de paquetes perdidos
            packetLoss = parseInt(packetLossMatch[1] || packetLossMatch[2] || '0', 10);
        }
        
        // Guardar información del ping para usar en los indicadores de estado
        if (selectedDevice) {
            deviceConnectionStatus[selectedDevice.ip] = {
                hasInternet: result.hasInternet,
                packetLoss: packetLoss
            };
        }
        
        // Actualizar la interfaz
        if (result.hasInternet) {
            if (packetLoss < 25) {
                pingStatus.classList.remove('alert-danger', 'alert-warning');
                pingStatus.classList.add('alert-success');
                pingStatus.textContent = '¡TIENE INTERNET! (Pérdida de paquetes: ' + packetLoss + '%)';
            } else {
                pingStatus.classList.remove('alert-danger', 'alert-success');
                pingStatus.classList.add('alert-warning');
                pingStatus.textContent = 'INTERNET LENTO (Pérdida de paquetes: ' + packetLoss + '%)';
            }
        } else {
            pingStatus.classList.remove('alert-success', 'alert-warning');
            pingStatus.classList.add('alert-danger');
            pingStatus.textContent = 'NO TIENE INTERNET (Pérdida de paquetes: ' + packetLoss + '%)';
        }

        pingModal.show();
        
        // Actualizar los indicadores de estado en la tabla
        displayDevices(allDevicesData);
    }

    function displayFileList(files) {
        const filesList = document.getElementById('filesList');
        const noFilesMessage = document.getElementById('noFilesMessage');

        filesList.innerHTML = '';

        if (files.length === 0) {
            noFilesMessage.classList.remove('d-none');
        } else {
            noFilesMessage.classList.add('d-none');
            files.forEach(file => {
                const listItem = document.createElement('button');
                listItem.classList.add('list-group-item', 'list-group-item-action');
                listItem.textContent = file;
                listItem.addEventListener('click', () => loadFileContent(file));
                filesList.appendChild(listItem);
            });
        }

        filesModal.show();
    }

    function loadFileContent(filename) {
        toggleLoading(true, 'Cargando contenido del archivo...');
        window.api.getFileContent(selectedDevice.ip, `/storage/emulated/0/Android/data/com.gaman.puntov_machine/files/${filename}`)
            .then(result => {
                toggleLoading(false);
                const fileContent = document.getElementById('fileContent');
                const fileContentModalTitle = document.getElementById('fileContentModalTitle');
                fileContent.textContent = result.content;
                fileContentModalTitle.textContent = `Contenido de ${filename}`;
                fileContentModal.show();
            })
            .catch(error => {
                console.error('Error loading file content:', error);
                toggleLoading(false);
            });
    }

    function toggleLoading(show, message = '') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingMessage = document.getElementById('loadingMessage');

        if (show) {
            loadingOverlay.classList.remove('d-none');
            loadingMessage.textContent = message;
        } else {
            loadingOverlay.classList.add('d-none');
        }
    }

    openDashboard.addEventListener('click', () => {
        window.open("https://login.tailscale.com/admin/machines", "_blank");
    });
});
