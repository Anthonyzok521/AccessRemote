const { contextBridge, ipcRenderer } = require('electron');
// Electron desde v12 requiere explícitamente permitir módulos nativos de Node.js
const exec = require('child_process').exec;
const path = require('path');
const os = require('os');
const fs = require('fs');

// Determine base path for executables
const isDev = process.env.NODE_ENV !== 'production';
const getResourcePath = () => {
  if (isDev) {
    return path.join(__dirname, 'resources');
  } else {
    return path.join(process.resourcesPath, 'resources');
  }
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Get Tailscale devices
  getTailscaleDevices: () => {
    return new Promise((resolve, reject) => {
      exec('tailscale status', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
        }
        
        const lines = stdout.trim().split('\n');
        const devices = [];
        
        for (const line of lines) {
          const parts = line.split(/\s+/);
          if (parts.length >= 5) {
            const ip = parts[0];
            const name = parts[1];
            const os = parts[3];
            
            // Process status
            let statusRaw = parts.slice(4).join(' ');
            const excludeWords = ['idle;', 'offers', 'exit', 'node;', 'tx', 'rx', ',', '3996', '0'];
            const statusParts = statusRaw.split(/\s+/).filter(w => !excludeWords.includes(w));
            let status = statusParts.join(' ');
            
            // If no "offline" in status, show as "connected"
            if (!status.includes('offline')) {
              status = 'connected';
            }
            
            devices.push({ ip, name, os, status });
          }
        }
        
        resolve(devices);
      });
    });
  },
  
  // Ping a device
  pingDevice: (ip) => {
    return new Promise((resolve, reject) => {
      const pingCmd = process.platform === 'win32' 
        ? `ping ${ip} -n 4` 
        : `ping -c 4 ${ip}`;
      
      exec(pingCmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(error);
          return;
        }
        
        const output = stdout.trim();
        const hasReply = output.includes('Reply from') || output.includes('0%') || output.includes('bytes from');
        
        // Look for lost packets info
        let lost = null;
        const lostLine = output.split('\n').find(line => 
          line.includes('Lost =') || line.includes('packet loss') || line.includes('100%'));
        
        if (lostLine) {
          // Extract the number of lost packets (platform specific)
          if (process.platform === 'win32') {
            try {
              lost = parseInt(lostLine.split('Lost =')[1].split('(')[0].trim().replace(',', ''));
            } catch (e) { /* ignore */ }
          } else {
            try {
              const match = lostLine.match(/(\d+)%\s+packet\s+loss/);
              lost = match ? parseInt(match[1]) : null;
              // Convert percentage to a binary 0/1 for consistency with Windows
              lost = lost === 0 ? 0 : 1; 
            } catch (e) { /* ignore */ }
          }
        }
        
        resolve({
          output,
          hasInternet: hasReply && lost === 0,
          rawOutput: stdout
        });
      });
    });
  },
  
  // Connect to Android device using ADB
  connectAdb: (ip) => {
    return new Promise((resolve, reject) => {
      const adbPath = path.join(getResourcePath(), 'scrcpy', 'adb.exe');
      
      exec(`"${adbPath}" connect ${ip}:5555`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(error);
          return;
        }
        
        resolve({ success: true, message: stdout });
      });
    });
  },
  
  // Launch scrcpy for remote control
  launchScrcpy: (ip) => {
    return new Promise((resolve, reject) => {
      const scrcpyDir = path.join(getResourcePath(), 'scrcpy');
      const cmd = process.platform === 'win32'
        ? `start cmd /K "cd "${scrcpyDir}" && scrcpy.exe --tcpip=${ip}:5555"`
        : `xterm -e "cd "${scrcpyDir}" && ./scrcpy --tcpip=${ip}:5555"`;
      
      exec(cmd, { shell: true }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(error);
          return;
        }
        
        resolve({ success: true });
      });
    });
  },
  
  // Open ADB shell with root
  openAdbShellRoot: (ip) => {
    return new Promise((resolve, reject) => {
      const adbPath = path.join(getResourcePath(), 'scrcpy', 'adb.exe');
      const cmd = process.platform === 'win32'
        ? `start cmd /K ""${adbPath}" -s ${ip}:5555 root && "${adbPath}" -s ${ip}:5555 shell"`
        : `xterm -e "${adbPath} -s ${ip}:5555 root && ${adbPath} -s ${ip}:5555 shell"`;
      
      exec(cmd, { shell: true }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(error);
          return;
        }
        
        resolve({ success: true });
      });
    });
  },
  
  // List files on Android device
  listFiles: (ip, path = "/storage/emulated/0/Android/data/com.gaman.puntov_machine/files/") => {
    return new Promise((resolve, reject) => {
      const adbPath = getResourcePath() + '/scrcpy/adb.exe';
      
      // First connect to the device
      exec(`"${adbPath}" connect ${ip}:5555`, (error, stdout, stderr) => {
        if (error || stdout.includes('unable') || stdout.includes('failed')) {
          reject({ error: 'Connection failed', message: stdout || stderr });
          return;
        }
        
        // Check if path exists
        exec(`"${adbPath}" -s ${ip}:5555 shell "[ -d '${path}' ] && echo OK || echo NO"`, 
          (error, stdout, stderr) => {
            if (error || !stdout.includes('OK')) {
              reject({ error: 'Path not found', message: `The path ${path} does not exist` });
              return;
            }
            
            // List files
            exec(`"${adbPath}" -s ${ip}:5555 shell "ls ${path}"`, 
              (error, stdout, stderr) => {
                if (error) {
                  reject({ error: 'Failed to list files', message: stderr });
                  return;
                }
                
                const files = stdout.trim().split(/\s+/)
                  .filter(f => f.endsWith('.json') || f.endsWith('.txt'));
                
                resolve({ files });
              });
          });
      });
    });
  },
  
  // Get file content from Android device
  getFileContent: (ip, filePath) => {
    return new Promise((resolve, reject) => {
      const adbPath = path.join(getResourcePath(), 'scrcpy', 'adb.exe');
      
      exec(`"${adbPath}" -s ${ip}:5555 shell "cat ${filePath}"`, 
        (error, stdout, stderr) => {
          if (error) {
            reject({ error: 'Failed to read file', message: stderr });
            return;
          }
          
          resolve({ content: stdout });
        });
    });
  }
});
