import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode('utf-8')
            return status, json.loads(body)
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode('utf-8')
        try:
            return status, json.loads(body)
        except Exception:
            return status, body
    except Exception as e:
        print(f"Network error: {e}")
        return None, None

def run_tests():
    print("--- STARTING AUTH API VERIFICATION TESTS ---")
    
    # 1. Health check
    print("\n1. Testing GET /api/health...")
    status, res = make_request("/api/health")
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 200 or not res.get("status") == "healthy":
        print("FAIL: Health check failed.")
        sys.exit(1)
    print("PASS: Health check success.")

    # 2. Registration validation (short password)
    print("\n2. Testing POST /api/auth/register with a short password...")
    bad_user = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "short"
    }
    status, res = make_request("/api/auth/register", "POST", bad_user)
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 422 or res.get("success") is not False:
        print("FAIL: Register with short password should return 422.")
        sys.exit(1)
    print("PASS: Correctly rejected short password.")

    # 3. Valid registration
    print("\n3. Testing valid registration...")
    import random
    rand_id = random.randint(1000, 9999)
    email = f"sujay+{rand_id}@example.com"
    valid_user = {
        "name": "Sujay MS",
        "email": email,
        "password": "secure_password_123"
    }
    status, res = make_request("/api/auth/register", "POST", valid_user)
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 201 or not res.get("success"):
        print("FAIL: Registration failed.")
        sys.exit(1)
    
    token = res["data"]["token"]
    user_id = res["data"]["user"]["id"]
    print(f"PASS: Registration successful. Token: {token[:20]}... UserID: {user_id}")

    # 4. Duplicate registration check
    print("\n4. Testing duplicate registration rejection...")
    status, res = make_request("/api/auth/register", "POST", valid_user)
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 409 or res.get("error", {}).get("code") != "EMAIL_ALREADY_EXISTS":
        print("FAIL: Duplicate registration check failed.")
        sys.exit(1)
    print("PASS: Duplicate registration correctly rejected.")

    # 5. Login test
    print("\n5. Testing POST /api/auth/login...")
    login_data = {
        "email": email,
        "password": "secure_password_123"
    }
    status, res = make_request("/api/auth/login", "POST", login_data)
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 200 or not res.get("success"):
        print("FAIL: Login failed.")
        sys.exit(1)
        
    login_token = res["data"]["token"]
    print("PASS: Login successful.")

    # 6. Fetch profile (/api/auth/me) with token
    print("\n6. Testing GET /api/auth/me with valid token...")
    status, res = make_request("/api/auth/me", "GET", token=login_token)
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 200 or not res.get("success") or res["data"]["user"]["email"] != email:
        print("FAIL: Fetching profile failed.")
        sys.exit(1)
    print("PASS: Profile fetched successfully.")

    # 7. Fetch profile (/api/auth/me) without token
    print("\n7. Testing GET /api/auth/me without token...")
    status, res = make_request("/api/auth/me", "GET")
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 401:
        print("FAIL: Fetch profile without token should return 401.")
        sys.exit(1)
    print("PASS: Profile query without token rejected correctly.")

    print("\n--- ALL AUTH API VERIFICATION TESTS PASSED SUCCESSFULLY! ---")
    sys.exit(0)

if __name__ == "__main__":
    run_tests()
