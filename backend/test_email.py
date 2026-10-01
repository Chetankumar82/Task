import os
import sys
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

print("=" * 60)
print("Hairdrama Tech - Gmail SMTP Verification Script")
print("=" * 60)
print(f"GMAIL_USER: {GMAIL_USER or '[NOT SET in backend/.env]'}")
print(f"GMAIL_APP_PASSWORD: {'[SET - ' + str(len(GMAIL_APP_PASSWORD)) + ' chars]' if GMAIL_APP_PASSWORD else '[NOT SET in backend/.env]'}")
print("=" * 60)

if not GMAIL_USER or not GMAIL_APP_PASSWORD:
    print("\n[!] Gmail credentials are not configured yet.")
    print("To enable real email sending to inboxes:")
    print("1. Go to Google Account Security: https://myaccount.google.com/security")
    print("2. Ensure 2-Step Verification is ON.")
    print("3. Generate an App Password at: https://myaccount.google.com/apppasswords")
    print("4. Add to backend/.env:")
    print("   GMAIL_USER=your-email@gmail.com")
    print("   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx")
    sys.exit(1)

import smtplib
from email.mime.text import MIMEText

recipient = sys.argv[1] if len(sys.argv) > 1 else GMAIL_USER

print(f"\nAttempting to connect to smtp.gmail.com:587 and send test email to: {recipient}...")

try:
    msg = MIMEText("Hello! This is a test email from Hairdrama Tech Task Management app.")
    msg["Subject"] = "🔔 [Hairdrama Tech] Gmail SMTP Test Successful!"
    msg["From"] = f"Hairdrama Tech Tasks <{GMAIL_USER}>"
    msg["To"] = recipient

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, recipient, msg.as_string())

    print(f"\n[OK] SUCCESS! Test email delivered to {recipient}.")
except Exception as e:
    print(f"\n[ERROR] Failed to send email: {e}")
    sys.exit(1)
