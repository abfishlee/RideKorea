import json
import os
import paramiko

SECRETS_PATH = r"e:\dev\RideKorea\secrets.json"

def run_diagnostics():
    if not os.path.exists(SECRETS_PATH):
        print(f"Error: secrets.json not found at {SECRETS_PATH}")
        return

    with open(SECRETS_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    ssh_config = config.get("ssh", {})
    host = ssh_config.get("host")
    port = ssh_config.get("port", 2222)
    username = ssh_config.get("username")
    password = ssh_config.get("password")

    if not host or not username or password == "INSERT_PASSWORD_HERE":
        print("Error: Please fill in secrets.json with valid SSH credentials and password.")
        return

    print(f"Connecting to homeserver {username}@{host}:{port} via SSH...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, port=port, username=username, password=password, timeout=10)
        print("SSH Connection successful! Gathering server diagnostics...\n")
        
        commands = {
            "OS Info": "uname -a",
            "OS Distribution": "cat /etc/os-release | grep -E '^(PRETTY_NAME|ID=)'",
            "Disk Space": "df -h /",
            "Memory Status": "free -m",
            "Docker Installed": "docker --version || echo 'Docker not installed'",
            "Docker Compose Installed": "docker compose version || docker-compose --version || echo 'Docker Compose not installed'",
            "Active Docker Containers": "docker ps -a --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}'",
            "Docker Images": "docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}'",
            "Running PM2 Apps": "pm2 list || echo 'PM2 not installed'"
        }
        
        results = {}
        for name, cmd in commands.items():
            print(f"Executing: {cmd}...")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            out = stdout.read().decode('utf-8', errors='ignore').strip()
            err = stderr.read().decode('utf-8', errors='ignore').strip()
            results[name] = out if out else (f"[Error/Empty] {err}" if err else "None")
            
        print("\n=== DIAGNOSTICS REPORT ===")
        for key, val in results.items():
            print(f"\n[{key}]")
            print(val)
            print("-" * 40)
            
    except Exception as e:
        print(f"Failed to connect or diagnose: {str(e)}")
    finally:
        ssh.close()
        print("\nSSH Connection closed.")

if __name__ == "__main__":
    run_diagnostics()
