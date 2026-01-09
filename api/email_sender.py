import smtplib
from email.mime.text import MIMEText

EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USER = "sakthibala2705@gmail.com"
EMAIL_PASS = "APP_PASSWORD"  # DO NOT hardcode

def send_email(to_email, subject, body):
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
    server.set_debuglevel(1)  # AFTER server creation
    server.starttls()
    server.login(EMAIL_USER, EMAIL_PASS)
    server.send_message(msg)
    server.quit()
