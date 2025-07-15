import tkinter as tk
import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from ttkbootstrap.tableview import Tableview
from tkinter import messagebox
import threading
import threading
import subprocess
import os

root = ttk.Window(themename="darkly", title="Access Remote", size=(580, 300))
root.iconbitmap("icon.ico")
# Frame horizontal para tabla y botón de tema
main_frame = ttk.Frame(root)
main_frame.pack(padx=20, pady=(20,10), fill="x")

# Ruta absoluta a adb.exe en la carpeta scrcpy
ADB_PATH = os.path.join(os.path.dirname(__file__), 'scrcpy', 'adb.exe')

# Tabla con los datos
columns = ("IP", "NAME", "OS", "STATUS")
tree = ttk.Treeview(main_frame, columns=columns, show="headings", height=8, bootstyle=PRIMARY)
for col in columns:
    tree.heading(col, text=col)
    tree.column(col, anchor="center", width=110)

# Paginación
PAGE_SIZE = 30
all_devices = []
current_page = [0]  # Usar lista para mutabilidad en closures

# Frame para paginador
paginator_frame = ttk.Frame(root)

# Controles de paginación
prev_btn = ttk.Button(paginator_frame, text="Anterior")
next_btn = ttk.Button(paginator_frame, text="Siguiente")
page_label = ttk.Label(paginator_frame, text="")

def get_tailscale_status():
    try:
        result = subprocess.run(["tailscale", "status"], capture_output=True, text=True, check=True)
        lines = result.stdout.strip().splitlines()
        data = []
        for line in lines:
            parts = line.split()
            if len(parts) >= 5:
                ip = parts[0]
                name = parts[1]
                os = parts[3]
                # Procesar status
                status_raw = " ".join(parts[4:])
                # Excluir palabras
                exclude_words = ["idle;", "offers", "exit", "node;", "tx", "rx", ",", "3996", "0"]
                status_parts = [w for w in status_raw.split() if w not in exclude_words]
                status = " ".join(status_parts)
                # Si no contiene 'offline', mostrar 'connected'
                if "offline" not in status:
                    status = "connected"
                data.append((ip, name, os, status))
        return data
    except Exception as e:
        return [("-", "-", "-", f"Error: {e}")]

def show_page(page):
    for row in tree.get_children():
        tree.delete(row)
    start = page * PAGE_SIZE
    end = start + PAGE_SIZE
    for row in all_devices[start:end]:
        tree.insert("", "end", values=row)
    # Actualizar label y botones
    total_pages = max(1, (len(all_devices) + PAGE_SIZE - 1) // PAGE_SIZE)
    page_label.config(text=f"Página {page+1} de {total_pages}")
    prev_btn.config(state=("normal" if page > 0 else "disabled"))
    next_btn.config(state=("normal" if end < len(all_devices) else "disabled"))
    if len(all_devices) > PAGE_SIZE:
        paginator_frame.pack(pady=(0, 5))
        prev_btn.pack(side="left", padx=5)
        page_label.pack(side="left", padx=5)
        next_btn.pack(side="left", padx=5)
    else:
        paginator_frame.pack_forget()

def fill_table():
    global all_devices
    all_devices = get_tailscale_status()
    current_page[0] = 0
    show_page(current_page[0])

# Acciones de paginación
prev_btn.config(command=lambda: [show_page(current_page[0]-1), current_page.__setitem__(0, current_page[0]-1)])
next_btn.config(command=lambda: [show_page(current_page[0]+1), current_page.__setitem__(0, current_page[0]+1)])

fill_table()
tree.pack(side="left", fill="x", expand=True)

def auto_connect_adb():
    # Mostrar alerta de conexión
    loading = tk.Toplevel(root)
    loading.title("Conectando")
    loading.geometry("250x80")
    loading.resizable(False, False)
    ttk.Label(loading, text="Conectando a dispositivos Android...").pack(pady=20)
    loading.grab_set()
    loading.transient(root)
    def do_connect():
        for row in all_devices:
            ip, name, osys, status = row
            if status == "connected" and osys.lower() == "android":
                try:
                    subprocess.run([ADB_PATH, "connect", f"{ip}:5555"], capture_output=True, text=True, timeout=20)
                except Exception:
                    pass
        loading.destroy()
    threading.Thread(target=do_connect, daemon=True).start()

root.after(100, auto_connect_adb)

# Espaciador para empujar los botones al fondo
spacer = ttk.Frame(root)
spacer.pack(expand=True, fill="both")

# Frame para los botones al fondo
button_frame = ttk.Frame(root)
button_frame.pack(side="bottom", pady=(0, 20), fill="x")

def connect_adb():
    selected = tree.selection()
    if not selected:
        messagebox.showwarning("Selecciona un elemento", "Debes seleccionar un elemento de la tabla para conectar ADB.")
        return
    ip = tree.item(selected[0], "values")[0]
    # Construir el comando para abrir terminal y ejecutar scrcpy.exe
    cmd = f'start cmd /K "cd scrcpy && scrcpy.exe --tcpip={ip}:5555"'
    try:
        subprocess.Popen(cmd, shell=True)
    except Exception as e:
        messagebox.showerror("Error", f"No se pudo ejecutar scrcpy: {e}")

connect_btn = ttk.Button(button_frame, text="CONNECT ADB", bootstyle=SUCCESS, command=connect_adb)
connect_btn.pack(side=LEFT, padx=10)

def ping_selected():
    selected = tree.selection()
    if not selected:
        messagebox.showwarning("Selecciona un elemento", "Debes seleccionar un elemento de la tabla para hacer ping.")
        return
    ip = tree.item(selected[0], "values")[0]

    loading = tk.Toplevel(root)
    loading.title("Cargando...")
    loading.geometry("250x80")
    loading.resizable(False, False)
    ttk.Label(loading, text="Realizando ping, espera...").pack(pady=20)
    loading.grab_set()
    loading.transient(root)

    def do_ping():
        try:
            # Usar el comando ping estándar de Windows
            result = subprocess.run(["ping", ip, "-n", "4"], capture_output=True, text=True, timeout=10)
            output = result.stdout.strip() or result.stderr.strip()
            loading.destroy()
            # Analizar resultado
            has_reply = "Reply from" in output
            lost_line = next((line for line in output.splitlines() if "Lost =" in line), "")
            lost = None
            if lost_line:
                try:
                    lost = int(lost_line.split("Lost =")[-1].split("(")[0].strip().replace(",", ""))
                except Exception:
                    lost = None
            if has_reply and lost == 0:
                status_msg = "\n\nResultado: ¡TIENE INTERNET!"
            else:
                status_msg = "\n\nResultado: NO TIENE INTERNET."
            messagebox.showinfo(f"Ping a {ip}", output + status_msg)
        except Exception as e:
            loading.destroy()
            messagebox.showerror("Error", f"No se pudo ejecutar ping: {e}")

    threading.Thread(target=do_ping, daemon=True).start()

def adb_shell_root():
    selected = tree.selection()
    if not selected:
        messagebox.showwarning("Selecciona un elemento", "Debes seleccionar un elemento de la tabla para abrir ADB SHELL ROOT.")
        return
    ip = tree.item(selected[0], "values")[0]
    cmd = f'start cmd /K ""{ADB_PATH}" -s {ip}:5555 root && "{ADB_PATH}" -s {ip}:5555 shell"'
    try:
        subprocess.Popen(cmd, shell=True)
    except Exception as e:
        messagebox.showerror("Error", f"No se pudo ejecutar adb shell root: {e}")

adb_shell_btn = ttk.Button(button_frame, text="ADB SHELL ROOT", bootstyle=PRIMARY, command=adb_shell_root)
adb_shell_btn.pack(side=LEFT, padx=10)

ping_btn = ttk.Button(button_frame, text="PING", bootstyle=INFO, command=ping_selected)
ping_btn.pack(side=LEFT, padx=10)

# Botón para refrescar la tabla al lado de la tabla principal
refresh_table_btn = ttk.Button(button_frame, text="REFRESCAR", bootstyle=WARNING, command=fill_table)
refresh_table_btn.pack(side=LEFT , padx=10)


def list_files():
    selected = tree.selection()
    if not selected:
        messagebox.showwarning("Selecciona un elemento", "Debes seleccionar un elemento de la tabla para listar archivos.")
        return
    ip = tree.item(selected[0], "values")[0]
    ruta = "/storage/emulated/0/Android/data/com.gaman.puntov_machine/files/"
    loading = tk.Toplevel(root)
    loading.title("Cargando...")
    loading.geometry("250x80")
    loading.resizable(False, False)
    ttk.Label(loading, text="Listando archivos, espera...").pack(pady=20)
    loading.grab_set()
    loading.transient(root)

    def do_list():
        try:
            # Conectar primero a la IP seleccionada
            connect_proc = subprocess.run([ADB_PATH, "connect", f"{ip}:5555"], capture_output=True, text=True, timeout=10)
            if "unable" in connect_proc.stdout.lower() or "failed" in connect_proc.stdout.lower():
                loading.destroy()
                messagebox.showerror("Error de conexión", f"No se pudo conectar a {ip}:5555\n\n{connect_proc.stdout.strip()}\n{connect_proc.stderr.strip()}")
                return
            # Validar existencia de la ruta
            check_cmd = [ADB_PATH, "-s", f"{ip}:5555", "shell", f"[ -d '{ruta}' ] && echo OK || echo NO"]
            check = subprocess.run(check_cmd, capture_output=True, text=True, timeout=10)
            if "OK" not in check.stdout:
                loading.destroy()
                messagebox.showerror("Ruta no encontrada", f"La ruta {ruta} no existe en el dispositivo.")
                return
            # Listar archivos
            list_cmd = [ADB_PATH, "-s", f"{ip}:5555", "shell", f"ls {ruta}"]
            files_proc = subprocess.run(list_cmd, capture_output=True, text=True, timeout=10)
            files = files_proc.stdout.strip().split()
            files = [f for f in files if f.endswith('.json') or f.endswith('.txt')]
            loading.destroy()
            if not files:
                messagebox.showinfo("Sin archivos", "No se encontraron archivos .json o .txt en la ruta.")
                return
            # Mostrar ventana con tabla de archivos
            show_files_window(ip, ruta, files)
        except Exception as e:
            loading.destroy()
            messagebox.showerror("Error", f"No se pudo listar archivos: {e}")

    threading.Thread(target=do_list, daemon=True).start()

def show_files_window(ip, ruta, files):
    win = tk.Toplevel(root)
    win.title(f"Archivos en {ruta}")
    win.geometry("600x400")
    ttk.Label(win, text=f"Archivos en {ruta}").pack(pady=5)
    files_table = ttk.Treeview(win, columns=("Archivo",), show="headings", height=15)
    files_table.heading("Archivo", text="Archivo")
    files_table.column("Archivo", anchor="w", width=550)
    for f in files:
        files_table.insert("", "end", values=(f,))
    files_table.pack(padx=10, pady=10, fill="both", expand=True)

    def on_select(event):
        sel = files_table.selection()
        if not sel:
            return
        filename = files_table.item(sel[0], "values")[0]
        # Extraer contenido
        loading2 = tk.Toplevel(win)
        loading2.title("Cargando archivo...")
        loading2.geometry("250x80")
        loading2.resizable(False, False)
        ttk.Label(loading2, text="Extrayendo archivo, espera...").pack(pady=20)
        loading2.grab_set()
        loading2.transient(win)
        def do_cat():
            try:
                cat_cmd = [ADB_PATH, "-s", f"{ip}:5555", "shell", f"cat {ruta}{filename}"]
                cat_proc = subprocess.run(cat_cmd, capture_output=True, text=True, timeout=15)
                loading2.destroy()
                show_file_content(filename, cat_proc.stdout)
            except Exception as e:
                loading2.destroy()
                messagebox.showerror("Error", f"No se pudo extraer el archivo: {e}")
        threading.Thread(target=do_cat, daemon=True).start()
    files_table.bind("<Double-1>", on_select)

def show_file_content(filename, content):
    win = tk.Toplevel(root)
    win.title(f"Contenido de {filename}")
    win.geometry("700x500")
    text = tk.Text(win, wrap="word")
    text.insert("1.0", content)
    text.config(state="disabled")
    text.pack(fill="both", expand=True, padx=10, pady=10)

list_files_btn = ttk.Button(button_frame, text="LISTAR ARCHIVOS", bootstyle=INFO, command=list_files)
list_files_btn.pack(side=LEFT, padx=10)

root.mainloop()
