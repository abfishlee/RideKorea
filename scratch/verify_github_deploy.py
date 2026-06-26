import json
import os
import paramiko

SECRETS_PATH = r"e:\dev\RideKorea\secrets.json"

def verify():
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
        print("Connected to homeserver to verify GitHub Actions deployment...")
        
        commands = {
            "Docker Containers": "docker ps --filter name=ridekorea",
            "Uvicorn Process": "ps -ef | grep uvicorn | grep -v grep",
            "Checking Uvicorn Port (8000)": "ss -tulnp | grep :8000 || netstat -tulnp | grep :8000",
            "Uvicorn Server Log": "tail -n 20 ~/actions-runner/_work/RideKorea/RideKorea/backend/uvicorn.log 2>/dev/null || echo 'Log not found yet'",
            "API Health Check (Internal)": "curl -sI http://localhost:8000/ | head -n 5 || echo 'Curl failed'"
        }
        
        for title, cmd in commands.items():
            print(f"\n=== {title} ===")
            print(f"[Command: {cmd}]")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            out = stdout.read().decode('utf-8', errors='ignore').strip()
            err = stderr.read().decode('utf-8', errors='ignore').strip()
            if out:
                print(out)
            if err:
                print(f"[Stderr] {err}")
                
    except Exception as e:
        print(f"Verification error: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    verify()
