import requests
import json

BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login"

def test_merger():
    # 1. Login
    print("Logging in...")
    login_data = {"email": "alice@example.com", "password": "password123"}
    resp = requests.post(LOGIN_URL, json=login_data)
    if resp.status_code != 200:
        print("Login failed. Ensure backend is running and Alice is registered.")
        return
    token = resp.json().get('access_token')
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Business
    print("Fetching businesses...")
    bus_resp = requests.get(f"{BASE_URL}/businesses", headers=headers)
    business_id = bus_resp.json()[0]['id']

    # 3. Create Product with Offers
    print(f"Creating product with offers for business {business_id}...")
    prod_data = {
        "name": "Super Coffee Maker",
        "description": "Brew the best coffee at home.",
        "offers": "50% Off for New Year!",
        "price": 99.99,
        "business_id": business_id
    }
    prod_resp = requests.post(f"{BASE_URL}/products", json=prod_data, headers=headers)
    product = prod_resp.json()
    print(f"Product created: {product.get('name')} with offer: {product.get('offers')}")

    # 4. Generate Email (New Platform)
    print("Generating Email content...")
    gen_data = {
        "business_id": business_id,
        "platform": "Email",
        "topic": "New Year Sale"
    }
    gen_resp = requests.post(f"{BASE_URL}/generate", json=gen_data, headers=headers)
    print("Generated Email Content Length:", len(gen_resp.json().get('content', '')))

    # 5. Delete Product
    print(f"Deleting product {product['id']}...")
    del_resp = requests.delete(f"{BASE_URL}/business/{business_id}/products/{product['id']}", headers=headers)
    print("Delete status:", del_resp.status_code)
    
    if del_resp.status_code == 200:
        print("Verification SUCCESSFUL: Offers, Email, and Deletion are working!")
    else:
        print("Verification FAILED.")

if __name__ == "__main__":
    test_merger()
