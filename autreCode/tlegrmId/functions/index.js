
import fetch from "node-fetch"; // تأكد أنك ثبّتته في package.json

import { onRequest } from "firebase-functions/v2/https";

// ضع توكن البوت هنا
const BOT_TOKEN = "8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;


export const telegramWebhook = onRequest(   
	{ region: "europe-west1" },
	async (req, res) => {
  
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
    `<code>${chatId}</code>\n` +
   ` إظعط عليه لنسخه وضعه في حقل "معرف دردشة تيليجرام" في تطبيق تنبيهات الأسعار. ` ;

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


