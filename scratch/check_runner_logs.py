import json
import os
import paramiko

SECRETS_PATH = r"e:\dev\RideKorea\secrets.json"

def check_logs():
    with open(SECRETS_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    ssh_config = config.get("ssh", {})
    host = ssh_config.get("host")
    port = ssh_config.get("port", 2222)
    username = ssh_config.get("username")
    password = ssh_config.get("password")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, port=port, username=username, password=password)
        print("Connected to homeserver to check runner journal logs...")
        
        # 1. Check systemd runner service journal logs (sudo required)
        cmd = f"echo '{password}' | sudo -S journalctl -u actions.runner.abfishlee-RideKorea.fishnoon.service -n 50 --no-pager"
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        print("\n=== SYSTEMD RUNNER LOGS ===")
        print(out)
        # 2. Check if uvicorn can start manually (test running for 5 seconds)
        cmd2 = "cd ~/actions-runner/_work/RideKorea/RideKorea/backend && timeout 5 venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000"
        print(f"\nExecuting manual uvicorn test: {cmd2}")
        stdin, stdout, stderr = ssh.exec_command(cmd2)
        out2 = stdout.read().decode('utf-8', errors='ignore').strip()
        err2 = stderr.read().decode('utf-8', errors='ignore').strip()
        print("=== MANUAL TEST OUT ===")
        print(out2)
        print("=== MANUAL TEST ERR ===")
        print(err2)


        
    except Exception as e:
        print(f"Error checking logs: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    check_logs()
