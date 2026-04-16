import subprocess
import sys

def run_auto_approver(comando):
    print(f"[*] Iniciando envoltorio inteligente para: {comando}")
    
    process = subprocess.Popen(
        comando,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        shell=True,
        bufsize=1
    )

    buffer = ""
    
    try:
        while True:
            char = process.stdout.read(1)
            
            if not char and process.poll() is not None:
                break

            sys.stdout.write(char)
            sys.stdout.flush()
            buffer += char

            # Mantener un buffer más grande (1000 caracteres) para capturar todo el menú
            if len(buffer) > 1000:
                buffer = buffer[-1000:]

            # Detectar que la pregunta inició y el menú completo finalizó de renderizarse
            if "Do you want to proceed?" in buffer and "Esc to cancel" in buffer:
                
                # Escanear el contenido del menú para tomar la decisión dinámica
                if "Yes, and don't ask again" in buffer:
                    print("\n[🤖 Menú extendido detectado: Enviando opción '2' (Sí + Guardar)...]")
                    process.stdin.write("2\n")
                else:
                    print("\n[🤖 Menú simple detectado: Enviando opción '1' (Yes)...]")
                    process.stdin.write("1\n")
                
                process.stdin.flush()
                
                # Limpiar el buffer para evitar bucles en el mismo prompt
                buffer = ""
                
    except KeyboardInterrupt:
        print("\n[*] Interrumpido por el usuario. Cerrando proceso...")
        process.terminate()

if __name__ == "__main__":
    # Reemplaza con el comando exacto que usas en Antigravity
    COMANDO_IA = "ollama launch claude --model glm-5.1:cloud" 
    
    run_auto_approver(COMANDO_IA)