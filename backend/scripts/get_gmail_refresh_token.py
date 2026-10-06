"""
One-time helper: obtain a Gmail API refresh token for sending email over HTTPS.

Why: Render's free tier blocks outbound SMTP (ports 25/465/587), so the backend
sends mail through the Gmail REST API (port 443) instead.

Prerequisites (Google Cloud Console, same project as your OAuth login is fine):
  1. APIs & Services -> Library -> enable "Gmail API".
  2. APIs & Services -> Credentials -> Create Credentials -> OAuth client ID
     -> Application type: "Desktop app". Copy the Client ID and Client Secret.
  3. OAuth consent screen: add your Gmail address as a Test user
     (or click "Publish app" so the refresh token does not expire after 7 days).

Usage:
  python scripts/get_gmail_refresh_token.py <CLIENT_ID> <CLIENT_SECRET>

Then set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN on Render.
"""
import sys
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests

PORT = 8765
REDIRECT_URI = f"http://localhost:{PORT}"
SCOPE = "https://www.googleapis.com/auth/gmail.send"


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    client_id, client_secret = sys.argv[1].strip(), sys.argv[2].strip()

    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode({
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
    })

    result = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            result["code"] = (params.get("code") or [None])[0]
            result["error"] = (params.get("error") or [None])[0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"<h2>Authorization received. You can close this tab.</h2>")

        def log_message(self, *args):
            pass

    print("=" * 70, flush=True)
    print("STEP 1: Open this URL in your browser to authorize Gmail API access:\n", flush=True)
    print(auth_url, flush=True)
    print("\n" + "=" * 70, flush=True)
    print("Waiting for you to log in and approve in the browser...", flush=True)
    try:
        webbrowser.open(auth_url)
    except Exception:
        pass
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    server.handle_request()

    if not result.get("code"):
        print("Authorization failed:", result.get("error"))
        sys.exit(1)

    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "code": result["code"],
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }, timeout=20)
    data = resp.json()
    if "refresh_token" not in data:
        print("Token exchange failed:", data)
        sys.exit(1)

    print("\nSUCCESS. Add these environment variables on Render (and in backend/.env):\n")
    print(f"GMAIL_CLIENT_ID={client_id}")
    print(f"GMAIL_CLIENT_SECRET={client_secret}")
    print(f"GMAIL_REFRESH_TOKEN={data['refresh_token']}")


if __name__ == "__main__":
    main()
