from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes
from telegram import Update
import requests
import os
import httpx

BOT_TOKEN = ("7915734676:AAEe49KAfuSQANkoo8iwqGvcCpAct81ozGQ")  # Your Telegram Bot API key
WEBHOOK_URL = "http://192.168.5.48:8090/api/keyword_alert"  # Your Flask endpoint

KEYWORDS = ["elon musk", "ai", "sanctions"]


async def handle_keywords(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message:
        return
    text = update.message.text.lower()
    for keyword in KEYWORDS:
        if keyword in text:
            payload = {
                "keyword": keyword,
                "message": update.message.text,
                "user": update.message.from_user.username,
                "chat_id": update.message.chat.id,
            }
            try:
                res = requests.post(WEBHOOK_URL, json=payload)
                print(f"✅ Sent alert for '{keyword}' — status: {res.status_code}")
                print("Response:", res.text)
            except Exception as e:
                print("❌ Error sending alert:", e)
            break  # Stop after first match


def run_bot():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_keywords))
    app.run_polling()


if __name__ == "__main__":
    run_bot()
