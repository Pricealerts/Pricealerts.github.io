/* 
import { initializeApp as initAdminApp, getApps } from 'firebase-admin/app';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import axios from 'axios';



// التهيئة الآمنة
if (getApps().length === 0) {
  initAdminApp();
}


// إعدادات الأداء
setGlobalOptions({
  region: 'us-central1',
  memory: '1GiB',
  timeoutSeconds: 60
});

// دالة HTTP الأساسية
export const api = onRequest({ cors: true }, async (req, res) => {
  try {  
    let result = {};
    
    if (req.method === 'GET') {
      if (req.query.action === "getId") {
        const idChat = req.query.idChat;
        result.alerts = await getAlertsByChatId(idChat);
      }
    } else if (req.method === 'POST') {
      const data = req.body;
      const action = data.action;
      
      if (action === 'setAlert') {
        result = await setAlert(data);
      } else if (action === 'deleteAlert') {
        result = await deleteAlert(data.id);
      } else {
        result.status = "error";
        result.message = "إجراء غير معروف";
      }
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// الدوال المساعدة المعدلة لتعمل مع Realtime Database
async function getAlertsByChatId(chatId) {
  const snapshot = await db.ref('alerts')
    .orderByChild('telegramChatId')
    .equalTo(chatId)
    .once('value');
  
  const alerts = [];
  snapshot.forEach((childSnapshot) => {
    const alert = childSnapshot.val();
    if (alert.status === "Active") {
      alerts.push({
        id: childSnapshot.key,
        ...alert
      });
    }
  });
  
  return alerts;
}

async function setAlert(data) {
  const { id, exchangeId, symbol, targetPrice, alertCondition, telegramChatId } = data;
  
  if (!id || !exchangeId || !symbol || !targetPrice || !telegramChatId || !alertCondition) {
    return { status: "error", message: "الرجاء تقديم جميع البيانات المطلوبة لتعيين تنبيه التليجرام" };
  }
  
  const alertData = {
    exchangeId,
    symbol,
    targetPrice: parseFloat(targetPrice),
    alertCondition,
    telegramChatId,
    status: "Active",
    requestTime: new Date().toISOString(),
    lastChecked: null
  };
  
  await db.ref(`alerts/${id}`).set(alertData);
  
  return { status: "success", message: "تم تعيين التنبيه بنجاح" };
}

async function deleteAlert(alertId) {
  if (!alertId) {
    return { status: "error", message: "الرجاء تقديم معرف التنبيه للحذف" };
  }
  
  await db.ref(`alerts/${alertId}`).remove();
  
  return { status: "success", message: "تم حذف التنبيه بنجاح" };
}

// بقية الدوال (checkAndSendAlerts, fetchCandlestickData, sendTelegramMessage) تبقى كما هي
// مع تعديل أي إشارة لـ Firestore إلى Realtime Database

export const checkAlerts = onSchedule({
  schedule: 'every 5 minutes',
  timeZone: 'Africa/Cairo',
  memory: '512MiB'
}, async () => {
  try {
    console.log('بدء التحقق من التنبيهات...');
    await checkAndSendAlerts();
    console.log('تم التحقق من التنبيهات بنجاح');
  } catch (error) {
    console.error('حدث خطأ أثناء التحقق:', error);
    throw error;
  }
});

// ... (بقية الكود الخاص بـ EXCHANGES_CONFIG والدوال الأخرى تبقى كما هي)


// تكوين المنصات (كما هو في الكود الأصلي)
const EXCHANGES_CONFIG = {
  binance: {
    name: "Binance",
    tickerPriceUrl: 'https://api.binance.com/api/v3/ticker/price',
    candlestickUrl: 'https://api.binance.com/api/v3/klines',
    usdtSuffix: 'USDT',
    parseCandle: (c) => ({
      time: parseInt(c[0]),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5])
    }),
    intervalMap: { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h' }
  },
    kucoin: {
        name: "KuCoin",
        tickerPriceUrl: 'https://api.kucoin.com/api/v1/market/orderbook/level1',
        candlestickUrl: 'https://api.kucoin.com/api/v1/market/candles',
        usdtSuffix: 'USDT',
        parseCandle: (c) => ({
            time: parseInt(c[0]) * 1000,
            open: parseFloat(c[1]),
            close: parseFloat(c[2]),
            high: parseFloat(c[3]),
            low: parseFloat(c[4]),
            volume: parseFloat(c[5])
        }),
        intervalMap: { '1m': '1min', '5m': '5min', '15m': '15min', '1h': '1hour' }
    },
    coincap: {
        name: "coincap",
        tickerPriceUrl: 'https://api.coincap.io/v2/public/tickers',
        candlestickUrl: 'https://api.coincap.io/v2/public/kline',
        usdtSuffix: 'USDT',
        parseCandle: (c) => ({
            time: parseInt(c.open_time) * 1000,
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close),
            volume: parseFloat(c.volume)
        }),
        intervalMap: { '1m': '1', '5m': '5', '15m': '15', '1h': '60' }
    },
    coingecko: {
        name: "coingecko",
        tickerPriceUrl: 'https://api.coingecko.com/api/v3/coins/',
        candlestickUrl: 'https://api.coingecko.com/api/v3/coins/',
        usdtSuffix: 'USD',
        parseCandle: (c) => ({
            time: c[0],
            open: c[1],
            high: c[2],
            low: c[3],
            close: c[4]
        }),
        intervalMap: { '1m': '1', '5m': '5', '15m': '15', '1h': '60' }
    },
    okx: {
        name: "OKX",
        tickerPriceUrl: 'https://www.okx.com/api/v5/market/tickers?instType=SPOT',
        candlestickUrl: 'https://www.okx.com/api/v5/market/candles?instType=SPOT',
        usdtSuffix: '-USDT',
        parseCandle: (c) => ({
            time: parseInt(c[0]),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[6])
        }),
        intervalMap: { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1H' }
    }
};

// تعريف middleware للـ CORS






async function checkAndSendAlerts() {
  const now = new Date();
  const snapshot = await db.collection('alerts')
    .where('status', '==', 'Active')
    .get();
  console.log('عدد التنبيهات النشطة:', snapshot.size);
  
  for (const doc of snapshot.docs) {
    const alert = doc.data();
    const requestTime = alert.requestTime.toDate();
    const timeDifferenceMs = now.getTime() - requestTime.getTime();
    const timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));
    
    let interval, limit;
    
    if (timeDifferenceMinutes <= 5) {
      interval = '1m';
      limit = Math.max(1, timeDifferenceMinutes);
    } else {
      interval = '5m';
      limit = 1;
    }
    
    console.log(`التحقق من ${alert.symbol} على ${EXCHANGES_CONFIG[alert.exchangeId].name}`);
    
    await doc.ref.update({ lastChecked: new Date() });
    
    const candles = await fetchCandlestickData(alert.exchangeId, alert.symbol, interval, limit);
    let triggered = false;
    let actualTriggerPrice = null;
    
    if (candles && candles.length > 0) {
      for (const candle of candles) {
        if (alert.alertCondition === 'less_than_or_equal') {
          if (candle.low <= alert.targetPrice) {
            triggered = true;
            actualTriggerPrice = candle.low;
            break;
          }
        } else if (alert.alertCondition === 'greater_than_or_equal') {
          if (candle.high >= alert.targetPrice) {
            triggered = true;
            actualTriggerPrice = candle.high;
            break;
          }
        }
      }
    }
    
    if (triggered) {
      console.log(`تنبيه! ${alert.symbol} وصل إلى ${actualTriggerPrice}`);
      const message = `🔔 تنبيه سعر ${EXCHANGES_CONFIG[alert.exchangeId].name}!\n<b>${alert.symbol}</b> وصل إلى <b>${actualTriggerPrice} USDT</b>`;
      const sendResult = await sendTelegramMessage(alert.telegramChatId, message);
      
      if (sendResult.success) {
        await doc.ref.delete();
      }
    }
  }
}

async function fetchCandlestickData(exchangeId, symbol, interval, limit) {
  const exchange = EXCHANGES_CONFIG[exchangeId];
  if (!exchange) return null;

  try {
    const response = await axios.get(`${exchange.candlestickUrl}?symbol=${symbol}&interval=${exchange.intervalMap[interval]}&limit=${limit}`);
    return response.data.map(exchange.parseCandle).slice(-limit);
  } catch (error) {
    console.error(`خطأ في جلب البيانات من ${exchange.name}:`, error);
    return null;
  }
}

async function sendTelegramMessage(chatId, messageText) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("لم يتم تعيين توكن بوت التليجرام");
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: messageText,
      parse_mode: 'HTML'
    });
    
    return { success: true, response: response.data };
  } catch (error) {
    console.error("فشل إرسال رسالة التليجرام:", error);
    return { success: false, error: error.message };
  }
}
 */

/* import {createUserWithEmailAndPassword ,getAuth, signInWithEmailAndPassword} from "firebase/auth";

// التهيئة الأساسية (بدون async)
const app = initializeApp();
const db = getFirestore();

const email = 'slimani.dadi@gmail.com';
const password = 'slmDadi.';
const auth = getAuth(app);
createUserWithEmailAndPassword(auth, email, password)
.then((userCredential) => {
    // Signed in 
    console.log('cryaha', userCredential.user);
})
.catch((error) => {
  console.log(error.code);
}); // تسجيل دخول مجهول


signInWithEmailAndPassword(auth, email, password)
  .then(() => {
    console.log('تم تسجيل الدخول بنجاح');
    // يمكنك هنا تنفيذ أي إجراءات إضافية بعد تسجيل الدخول
  })
  .catch((error) => {
    console.error('خطأ في تسجيل الدخول:', error);
    // يمكنك هنا التعامل مع الأخطاء مثل عرض رسالة للمستخدم
  }); 

 */


