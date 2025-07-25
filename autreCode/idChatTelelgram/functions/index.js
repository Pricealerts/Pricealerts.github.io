const functions = require("firebase-functions");
const fetch = require("node-fetch"); // تأكد أنك ثبّتته في package.json

// ضع توكن البوت هنا
const BOT_TOKEN = "8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const message = req.body.message;
  if (!message) {
    return res.status(200).send("No message");
  }

  const chatId = message.chat.id;
  const username = message.from.username || "مستخدم بدون اسم";
  const text = message.text || "";

  console.log("Received from Telegram:", text);

  // 👇 مثال: إعادة إرسال نفس الرسالة مع إضافة ردّ
  // parse_mode: "HTML" // يمكنك استخدام Markdown أو HTML حسب الحاجة
  const reply =
    `أهلاً بك! ${username} معرف دردشتك (Chat ID) هو:\n` +
    `<code>${chatId}</code>\n\n` +
    `لإضافة تنبيه سعر عملة رقمية، استخدم تطبيق ` +
    `<a href='https://pricealerts.github.io?id=${chatId}'>تنبيهات الأسعار</a>` ;

  try {
    await fetch(TELEGRAM_API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: chatId,
        text: reply,
        parse_mode: "HTML",
      }),
    });

    res.status(200).send("Message sent");
  } catch (err) {
    console.error("Failed to send message", err);
    res.status(500).send("Failed to send message");
  }
});
