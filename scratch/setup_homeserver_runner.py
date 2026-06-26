import os
import json
import paramiko

SECRETS_PATH = r"e:\dev\RideKorea\secrets.json"

def load_ssh_config():
    if not os.path.exists(SECRETS_PATH):
        raise FileNotFoundError(f"secrets.json not found at {SECRETS_PATH}")
    with open(SECRETS_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)
    return config.get("ssh", {})

def setup_runner():
    try:
        ssh_config = load_ssh_config()
        host = ssh_config.get("host")
        port = ssh_config.get("port", 2222)
        username = ssh_config.get("username")
        password = ssh_config.get("password")
        
        if not host or not username:
            print("Error: secrets.json credentials are not valid.")
            return

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        print(f"Connecting to {username}@{host}:{port} to install GitHub Actions Runner...")
        ssh.connect(host, port=port, username=username, password=password)
        print("Connected successfully.")
        
        # 1. Create runner directory
        print("Creating actions-runner directory...")
        stdin, stdout, stderr = ssh.exec_command("mkdir -p ~/actions-runner")
        stdout.read(); stderr.read() # Wait for completion

        # 2. Get latest runner version via GitHub API (fallback to 2.320.0 if fails)
        print("Checking latest Github Runner version...")
        cmd_version = "curl -s https://api.github.com/repos/actions/runner/releases/latest | grep tag_name | cut -d '\"' -f 4 | sed 's/v//'"
        stdin, stdout, stderr = ssh.exec_command(cmd_version)
        version = stdout.read().decode('utf-8').strip()
        
        if not version or len(version) > 10 or "/" in version:
            print("Failed to auto-detect version. Using fallback version: 2.320.0")
            version = "2.320.0"
        else:
            print(f"Detected latest Runner version: {version}")

        # 3. Download and Extract Runner
        tar_name = f"actions-runner-linux-x64-{version}.tar.gz"
        download_url = f"https://github.com/actions/runner/releases/download/v{version}/{tar_name}"
        
        print(f"Downloading Runner from: {download_url}")
        
        # Check if already downloaded or needs download
        check_cmd = f"test -f ~/actions-runner/{tar_name} && echo 'exists' || echo 'needs_download'"
        stdin, stdout, stderr = ssh.exec_command(check_cmd)
        exists = stdout.read().decode('utf-8').strip()
        
        if exists != "exists":
            download_cmd = f"cd ~/actions-runner && curl -o {tar_name} -L {download_url}"
            print("Downloading (this might take a moment)...")
            stdin, stdout, stderr = ssh.exec_command(download_cmd)
            # Read output in blocks to prevent buffer exhaustion and monitor progress
            while not stdout.channel.exit_status_ready():
                if stdout.channel.recv_ready():
                    print(".", end="", flush=True)
            print("\nDownload finished.")
        else:
            print("Runner package already exists, skipping download.")

        # Extract
        print("Extracting runner archive...")
        extract_cmd = f"cd ~/actions-runner && tar xzf ./{tar_name}"
        stdin, stdout, stderr = ssh.exec_command(extract_cmd)
        stdout.read(); stderr.read()
        print("Extraction complete.")

        # 4. Configure the runner
        # Token provided by user: ACALOLR46K5VNY3NJXID7ODKHSGT6
        token = "ACALOLR46K5VNY3NJXID7ODKHSGT6"
        repo_url = "https://github.com/abfishlee/RideKorea"
        
        print("Configuring the Github Actions Runner (unattended mode)...")
        # Remove old configuration if exists
        ssh.exec_command("cd ~/actions-runner && ./config.sh remove --token " + token)
        
        # Configure new
        config_cmd = f"cd ~/actions-runner && ./config.sh --url {repo_url} --token {token} --unattended --replace"
        stdin, stdout, stderr = ssh.exec_command(config_cmd)
        
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        print("[Config Output]")
        print(out)
        if err:
            print("[Config Error/Warning]")
            print(err)

        # 5. Install and Start Service
        # We need sudo for service registration. We will pass password via stdin to sudo -S
        print("Installing Runner as system service...")
        service_install_cmd = f"cd ~/actions-runner && echo '{password}' | sudo -S ./svc.sh install"
        stdin, stdout, stderr = ssh.exec_command(service_install_cmd)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        print("[Service Install Output]")
        print(out)
        if err:
            print("[Service Install Error]")
            print(err)
            
        print("Starting Runner service...")
        service_start_cmd = f"cd ~/actions-runner && echo '{password}' | sudo -S ./svc.sh start"
        stdin, stdout, stderr = ssh.exec_command(service_start_cmd)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        print("[Service Start Output]")
        print(out)
        if err:
            print("[Service Start Error]")
            print(err)
            
        print("\nChecking service status...")
        service_status_cmd = f"cd ~/actions-runner && ./svc.sh status"
        stdin, stdout, stderr = ssh.exec_command(service_status_cmd)
        print(stdout.read().decode('utf-8'))
        
        print("GitHub Actions Runner Setup successfully completed!")
        
    except Exception as e:
        print(f"Runner Setup failed: {str(e)}")
    finally:
        ssh.close()
        print("Connection closed.")

if __name__ == "__main__":
    setup_runner()
