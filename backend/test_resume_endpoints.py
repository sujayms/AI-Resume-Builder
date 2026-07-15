import urllib.request
import json
import sys
import random

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
    print("--- STARTING RESUME CRUD API VERIFICATION TESTS ---")
    
    # 1. Register User A
    rand_a = random.randint(1000, 9999)
    email_a = f"usera_{rand_a}@example.com"
    user_a_data = {
        "name": "User A",
        "email": email_a,
        "password": "secure_password_123"
    }
    status, res = make_request("/api/auth/register", "POST", user_a_data)
    if status != 201 or not res.get("success"):
        print(f"FAIL: Failed to register User A (Status: {status})")
        sys.exit(1)
    token_a = res["data"]["token"]
    print(f"PASS: User A registered. Email: {email_a}")

    # 2. Register User B
    rand_b = random.randint(1000, 9999)
    email_b = f"userb_{rand_b}@example.com"
    user_b_data = {
        "name": "User B",
        "email": email_b,
        "password": "secure_password_123"
    }
    status, res = make_request("/api/auth/register", "POST", user_b_data)
    if status != 201 or not res.get("success"):
        print(f"FAIL: Failed to register User B (Status: {status})")
        sys.exit(1)
    token_b = res["data"]["token"]
    print(f"PASS: User B registered. Email: {email_b}")

    # 3. Create resume without title (validation failure)
    print("\n3. Testing POST /api/resumes with validation failure (missing title)...")
    status, res = make_request("/api/resumes", "POST", {"description": "A description"}, token_a)
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 422 or res.get("success") is not False:
        print("FAIL: Creation without title should return 422.")
        sys.exit(1)
    print("PASS: Correctly rejected missing title.")

    # 4. Create valid resume for User A
    print("\n4. Testing valid resume creation for User A...")
    resume_payload = {
        "title": "Software Engineer Resume",
        "description": "My primary technical resume",
        "content": {
            "fullName": "User A Full Name",
            "email": email_a,
            "phone": "+1-555-0199",
            "summary": "Experienced python developer.",
            "skills": "Python, Flask, SQL"
        }
    }
    status, res = make_request("/api/resumes", "POST", resume_payload, token_a)
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 201 or not res.get("success"):
        print("FAIL: Failed to create valid resume.")
        sys.exit(1)
    resume_id = res["data"]["id"]
    print(f"PASS: Resume created successfully. ID: {resume_id}")

    # 5. Get User A resumes list
    print("\n5. Testing GET /api/resumes for User A...")
    status, res = make_request("/api/resumes", "GET", token=token_a)
    print(f"Response Status: {status}")
    print(f"Response contains {len(res.get('data', []))} items.")
    if status != 200 or len(res.get("data", [])) != 1:
        print("FAIL: Expected User A to have exactly 1 resume in list.")
        sys.exit(1)
    if res["data"][0]["id"] != resume_id:
        print("FAIL: Resume ID in list does not match created ID.")
        sys.exit(1)
    print("PASS: Successfully retrieved User A's resumes list.")

    # 6. Get User B resumes list (should be empty)
    print("\n6. Testing GET /api/resumes for User B (should be empty)...")
    status, res = make_request("/api/resumes", "GET", token=token_b)
    print(f"Response Status: {status}")
    print(f"Response contains {len(res.get('data', []))} items.")
    if status != 200 or len(res.get("data", [])) != 0:
        print("FAIL: Expected User B to have 0 resumes.")
        sys.exit(1)
    print("PASS: User B resume list is empty.")

    # 7. Get specific resume by ID (User A accessing their own)
    print(f"\n7. Testing GET /api/resumes/{resume_id} as User A...")
    status, res = make_request(f"/api/resumes/{resume_id}", "GET", token=token_a)
    print(f"Response Status: {status}")
    if status != 200 or res["data"]["title"] != "Software Engineer Resume":
        print("FAIL: User A failed to fetch their own resume.")
        sys.exit(1)
    print("PASS: User A retrieved own resume successfully.")

    # 8. Get specific resume by ID (User B accessing User A's) - SECURITY CHECK
    print(f"\n8. Testing GET /api/resumes/{resume_id} as User B (Should be Forbidden)...")
    status, res = make_request(f"/api/resumes/{resume_id}", "GET", token=token_b)
    print(f"Response Status: {status}")
    print(f"Response: {res}")
    if status != 403:
        print("FAIL: Expected 403 Forbidden when User B accesses User A's resume.")
        sys.exit(1)
    print("PASS: Correctly blocked User B from reading User A's resume.")

    # 9. Update resume as User A
    print(f"\n9. Testing PUT /api/resumes/{resume_id} as User A...")
    update_payload = {
        "title": "Senior Python Engineer Resume",
        "description": "Updated primary resume",
        "content": {
            "fullName": "User A Upgraded Name",
            "email": email_a,
            "phone": "+1-555-9999",
            "summary": "Senior python developer with Flask expertise.",
            "skills": "Python, Flask, PostgreSQL, Docker"
        }
    }
    status, res = make_request(f"/api/resumes/{resume_id}", "PUT", update_payload, token_a)
    print(f"Response Status: {status}")
    if status != 200 or res["data"]["title"] != "Senior Python Engineer Resume" or res["data"]["content"]["fullName"] != "User A Upgraded Name":
        print("FAIL: Failed to update resume.")
        sys.exit(1)
    print("PASS: Successfully updated resume as User A.")

    # 10. Update resume as User B - SECURITY CHECK
    print(f"\n10. Testing PUT /api/resumes/{resume_id} as User B (Should be Forbidden)...")
    status, res = make_request(f"/api/resumes/{resume_id}", "PUT", update_payload, token_b)
    print(f"Response Status: {status}")
    if status != 403:
        print("FAIL: Expected 403 Forbidden when User B updates User A's resume.")
        sys.exit(1)
    print("PASS: Correctly blocked User B from modifying User A's resume.")

    # 11. Delete resume as User B - SECURITY CHECK
    print(f"\n11. Testing DELETE /api/resumes/{resume_id} as User B (Should be Forbidden)...")
    status, res = make_request(f"/api/resumes/{resume_id}", "DELETE", token=token_b)
    print(f"Response Status: {status}")
    if status != 403:
        print("FAIL: Expected 403 Forbidden when User B deletes User A's resume.")
        sys.exit(1)
    print("PASS: Correctly blocked User B from deleting User A's resume.")

    # 12. Delete resume as User A
    print(f"\n12. Testing DELETE /api/resumes/{resume_id} as User A...")
    status, res = make_request(f"/api/resumes/{resume_id}", "DELETE", token=token_a)
    print(f"Response Status: {status}")
    if status != 200 or not res.get("success"):
        print("FAIL: Failed to delete resume as User A.")
        sys.exit(1)
    print("PASS: Successfully deleted resume as User A.")

    # 13. Verify resume is deleted
    print(f"\n13. Testing GET /api/resumes/{resume_id} after deletion...")
    status, res = make_request(f"/api/resumes/{resume_id}", "GET", token=token_a)
    print(f"Response Status: {status}")
    if status != 404:
        print("FAIL: Resume should return 404 after being deleted.")
        sys.exit(1)
    print("PASS: Deleted resume returns 404.")

    print("\n--- ALL RESUME CRUD API VERIFICATION TESTS PASSED SUCCESSFULLY! ---")
    sys.exit(0)

if __name__ == "__main__":
    run_tests()
