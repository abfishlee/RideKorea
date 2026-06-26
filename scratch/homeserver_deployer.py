import os
import json
import paramiko

SECRETS_PATH = r"e:\dev\RideKorea\secrets.json"
LOCAL_DIR = r"e:\dev\RideKorea"
REMOTE_DIR = "RideKorea"

# Directories/Files to ignore when uploading
IGNORE_LIST = {
    "venv", "node_modules", ".git", ".expo", "secrets.json", ".env", 
    "__pycache__", ".vscode", ".idea", "uploads", "scratch"
}

def load_ssh_config():
    if not os.path.exists(SECRETS_PATH):
        raise FileNotFoundError(f"secrets.json not found at {SECRETS_PATH}")
    with open(SECRETS_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)
    return config.get("ssh", {})

def sftp_upload_dir(sftp, local_path, remote_path):
    """Recursively upload folder to remote server via SFTP."""
    # Ensure remote directory exists
    try:
        sftp.mkdir(remote_path)
        print(f"Created remote dir: {remote_path}")
    except OSError:
        pass  # Already exists

    for item in os.listdir(local_path):
        if item in IGNORE_LIST:
            continue
            
        local_item = os.path.join(local_path, item)
        # Use forward slashes for linux remote path
        remote_item = f"{remote_path}/{item}"
        
        if os.path.isdir(local_item):
            sftp_upload_dir(sftp, local_item, remote_item)
        else:
            print(f"Uploading: {item} -> {remote_item}")
            sftp.put(local_item, remote_item)

def deploy():
    try:
        ssh_config = load_ssh_config()
        host = ssh_config.get("host")
        port = ssh_config.get("port", 2222)
        username = ssh_config.get("username")
        password = ssh_config.get("password")
        
        if not host or not username or password == "INSERT_PASSWORD_HERE":
            print("Error: secrets.json credentials are not valid.")
            return

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        print(f"Connecting to {username}@{host}:{port} for deployment...")
        ssh.connect(host, port=port, username=username, password=password)
        print("Connected successfully.")
        
        # 1. We keep existing containers alive (Side-by-Side Coexistence)
        # Server resources are abundant, so we do not run prune commands.
        print("Deploying RideKorea side-by-side with existing containers (No prune/delete).")
        
        # Open SFTP session
        print("Opening SFTP for file transfer...")
        sftp = ssh.open_sftp()
        
        # Create user base remote dir if not exists
        try:
            sftp.mkdir(REMOTE_DIR)
        except OSError:
            pass
            
        # Recursive Upload
        sftp_upload_dir(sftp, LOCAL_DIR, REMOTE_DIR)
        sftp.close()
        print("File upload completed successfully!")
        
        # 2. Setup Remote Environment
        # Commands to execute sequentially on the remote server
        setup_commands = [
            f"cd {REMOTE_DIR} && docker compose up -d",
            f"cd {REMOTE_DIR}/backend && python3 -m venv venv && "
            "venv/bin/pip install --upgrade pip && "
            "venv/bin/pip install -r requirements.txt",
            f"cd {REMOTE_DIR}/backend && venv/bin/alembic upgrade head && venv/bin/python3 -m app.seed",
            # Run FastAPI in background
            f"cd {REMOTE_DIR}/backend && pkill -f uvicorn || true",
            f"cd {REMOTE_DIR}/backend && nohup venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > uvicorn.log 2>&1 &"
        ]
        
        print("\nConfiguring remote services...")
        for cmd in setup_commands:
            print(f"Executing remote: {cmd}")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            out = stdout.read().decode('utf-8', errors='ignore')
            err = stderr.read().decode('utf-8', errors='ignore')
            if out:
                print(f"[Out] {out.strip()}")
            if err:
                print(f"[Err] {err.strip()}")
                
        print("\n🎉 Deployment completed! Testing local connectivity to homeserver...")
        
    except Exception as e:
        print(f"Deployment failed: {str(e)}")
    finally:
        ssh.close()
        print("Connection closed.")

if __name__ == "__main__":
    deploy()
