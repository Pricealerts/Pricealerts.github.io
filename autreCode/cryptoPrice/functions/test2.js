// index.js - باستخدام الجيل الثاني من Firebase Functions مع Realtime Database

const functions = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp({
  databaseURL: "https://alertprice-c0176.firebaseio.com" // <-- عدل هذا بالمعرف الخاص بك
});

const db = admin.database();

// إرسال تنبيه إلى Telegram
async function sendTelegramAlert(chatId, message) {
  const token = "8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE" ; // <-- ضع توكن البوت الخاص بك
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await axios.post(url, {
    chat_id: chatId,
    text: message,
  });
}

// دالة للحصول على سعر من Binance (أو أي منصة أخرى)
async function fetchPrice(symbol, source) {
  switch (source) {
    case "binance":
      const binance = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      return parseFloat(binance.data.price);
    case "okx":
      const okx = await axios.get(`https://www.okx.com/api/v5/market/ticker?instId=${symbol}`);
      return parseFloat(okx.data.data[0].last);
    case "kucoin":
      const kucoin = await axios.get(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}`);
      return parseFloat(kucoin.data.data.price);
    default:
      throw new Error("Unknown source");
  }
}

// وظيفة HTTP لإضافة تنبيه
exports.addAlert = onRequest(async (req, res) => {
  const { id, chatId, symbol, source, condition, target } = req.body;
  if (!id || !chatId || !symbol || !source || !condition || !target) {
    return res.status(400).send("Missing parameters");
  }

  await db.ref(`alerts/${id}`).set({ chatId, symbol, source, condition, target });
  res.send("Alert added.");
});

// وظيفة HTTP لحذف تنبيه
exports.deleteAlert = onRequest(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).send("Missing ID");
  await db.ref(`alerts/${id}`).remove();
  res.send("Alert deleted.");
});

// وظيفة HTTP لجلب التنبيهات
exports.getAlerts = onRequest(async (req, res) => {
  const snapshot = await db.ref("alerts").once("value");
  res.json(snapshot.val());
});

// وظيفة مجدولة للتحقق من التنبيهات كل 1 دقيقة
exports.checkAlerts = onSchedule("every 5 minutes", async () => {
  const snapshot = await db.ref("alerts").once("value");
  const alerts = snapshot.val();

  if (!alerts) return;

  for (const id in alerts) {
    const { chatId, symbol, source, condition, target } = alerts[id];
    try {
      const price = await fetchPrice(symbol, source);
      if (
        (condition === ">" && price > target) ||
        (condition === "<" && price < target)
      ) {
        await sendTelegramAlert(chatId, `🔔 السعر ${price} تحقق من الشرط ${condition} ${target} لـ ${symbol} من ${source}`);
        await db.ref(`alerts/${id}`).remove();
      }
    } catch (err) {
      console.error("Error checking alert", id, err);
    }
  }
});



