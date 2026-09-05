import json
import urllib.request
import urllib.error
import urllib.parse

# Supabase Configuration
SUPABASE_URL = "https://mniarauxuzqcmdrplgiz.supabase.co"
SUPABASE_KEY = "sb_publishable_lyGIIhz89nFb_vMNQVfLCA_HvJeEk_5"

def supabase_request(method: str, endpoint: str, data=None, extra_headers=None):
    """
    Helper function to make Supabase PostgREST API requests using Python's standard library.
    Works with zero external pip dependencies.
    """
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    if extra_headers:
        headers.update(extra_headers)
    
    req_body = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method.upper())
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            content_range = response.headers.get('Content-Range')
            response_data = response.read().decode('utf-8')
            parsed = json.loads(response_data) if response_data else []
            return {
                "status": status,
                "data": parsed,
                "content_range": content_range,
                "error": None
            }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ""
        parsed = None
        try:
            parsed = json.loads(error_body) if error_body else None
        except Exception:
            parsed = {"message": error_body}
        return {
            "status": e.code,
            "data": None,
            "error": parsed or {"message": f"HTTP Error {e.code}"}
        }
    except Exception as e:
        return {
            "status": 500,
            "data": None,
            "error": {"message": str(e)}
        }
