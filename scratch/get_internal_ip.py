import json
import os
import paramiko

SECRETS_PATH = r"e:\dev\RideKorea\secrets.json"

def get_ip():
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
        print("Connected to check internal IP...")
        
        # Run hostname -I to get all internal IPs
        stdin, stdout, stderr = ssh.exec_command("hostname -I")
        ips = stdout.read().decode('utf-8').strip()
        print(f"Internal IPs: {ips}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    get_ip()
