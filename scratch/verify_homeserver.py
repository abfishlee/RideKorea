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
        print("Connected to verify homeserver internal state...")
        
        commands = [
            "docker ps | grep ridekorea",
            "cat ~/RideKorea/backend/uvicorn.log",
            "netstat -tulnp 2>/dev/null | grep -E '(8000|5435)' || ss -tulnp | grep -E '(8000|5435)'"
        ]
        
        for cmd in commands:
            print(f"\n[Command: {cmd}]")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            print(stdout.read().decode('utf-8', errors='ignore').strip())
            err = stderr.read().decode('utf-8', errors='ignore').strip()
            if err:
                print(f"[Err/Stderr] {err}")
                
    except Exception as e:
        print(f"Verification error: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    verify()
