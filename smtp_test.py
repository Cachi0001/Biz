import smtplib
from email.mime.text import MIMEText

# Fill in your SMTP credentials and test recipient below
smtp_server = "smtp.gmail.com"  # Or your provider
smtp_port = 587
smtp_user = "onyemechicaleb4@gmail.com"
smtp_pass = "ltwpeixmojgbauub"  # no spaces!

from_email = smtp_user
# You can change to_email to another address for testing
to_email = "passioncaleb5@gmail.com"

msg = MIMEText("We thank God")
msg["Subject"] = "SMTP Test"
msg["From"] = from_email
msg["To"] = to_email

try:
    print(f"Connecting to {smtp_server}:{smtp_port} as {smtp_user}...")
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(from_email, to_email, msg.as_string())
    print("Email sent successfully!")
except Exception as e:
    print("SMTP error:", e)
