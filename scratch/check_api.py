import urllib.request
import json

def check_health(url):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, response.read().decode('utf-8')
    except Exception as e:
        return None, str(e)

print("Checking API Health (Port 8000)...")
status, body = check_health("http://183.122.64.233:8000/")
print(f"Status: {status}, Body: {body}")

print("\nChecking API Docs (Port 8000)...")
status, body = check_health("http://183.122.64.233:8000/docs")
print(f"Status: {status}, Body: {body[:100]}...")

print("\nChecking Mock Provider (Port 9100)...")
status, body = check_health("http://183.122.64.233:9100/health")
print(f"Status: {status}, Body: {body}")
