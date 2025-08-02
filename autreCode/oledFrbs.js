//const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");


admin.initializeApp();

// *** بيانات اعتماد Telegram Bot API (لا تنس تحديثها) ***
const TELEGRAM_BOT_TOKEN = "8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE"; // احصل عليه من @BotFather
/* let responseAppScrpt = {
  action : 'okResponse',
  dltRw : []
}; */

let dltRwApp = []
const APPS_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbz0hE-JXd26WjQtLOwp3SZI5_x5ZETBZjWPxFutRyZiPMDn01khIam6tVxBanNl-O2s/exec";

exports.proxyRequest = onRequest(
  { region: "europe-west1" },
   (req, res) => {
    const tabelAlert = req.method === "POST" ? req.body.datas : req.query.datas;
    res.send("cbn");

    if (!tabelAlert) {
      return res
        .status(400)
        .json({ error: "The 'url' parameter is required." });
    }
    try {
      //const response = await axios.get(tabelAlert);
      checkAndSendAlerts(tabelAlert)

 /*  const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  res.send(`ذاكرة مستخدمة: ~${Math.round(usedMemory)}MB`); */

    } catch (error) {
      logger.error("Axios error:", error.message);
      return res.status(500).json({
        error: "Failed to fetch data",
        details: error.message,
      });
    }
  }
);

// تعريف المنصات المدعومة وواجهات برمجة العملات الخاصة بها للجانب الخلفي (Apps Script)
const EXCHANGES_CONFIG = {
    binance: {
        name: "Binance",
        tickerPriceUrl: 'https://api.binance.com/api/v3/ticker/price',
        candlestickUrl: 'https://api.binance.com/api/v3/klines', // نقطة نهاية الشموع
        usdtSuffix: 'USDT',
        // لتفسير بيانات الشمعة [timestamp, open, high, low, close, volume, ...]
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
        // لتفسير بيانات الشمعة [timestamp, open, close, high, low, volume, amount]
        parseCandle: (c) => ({
            time: parseInt(c[0]) * 1000, // KuCoin returns seconds
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
        candlestickUrl: 'https://api.coincap.io/v2/public/kline', // coincap v2 kline for spot
        usdtSuffix: 'USDT',
        // لتفسير بيانات الشمعة (open_time, open, high, low, close, volume, ...)
        parseCandle: (c) => ({
            time: parseInt(c.open_time) * 1000, // coincap returns seconds
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
        candlestickUrl: 'https://api.coingecko.com/api/v3/coins/', // coingecko v2 kline for spot
        usdtSuffix: 'USD',
        // لتفسير بيانات الشمعة (open_time, open, high, low, close, volume, ...)
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
        tickerPriceUrl: 'https://www.okx.com/api/v5/market/tickers',
        candlestickUrl: 'https://www.okx.com/api/v5/market/candles',
        usdtSuffix: '-USDT',
        // لتفسير بيانات الشمعة [timestamp, open, high, low, close, volume, ...]
        parseCandle: (c) => ({
            time: parseInt(c[0]),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[6]) // OKX has different volume fields
        }),
        intervalMap: { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1H' }
    }
};


async function checkAndSendAlerts(data) {

  const currentTriggerTime = new Date(); // وقت تشغيل الـ Trigger الحالي

  // نتكرر على الصفوف من الأسفل للأعلى لسهولة الحذف
  for (let i = data.length - 1; i >= 0; i--) { // البدء من آخر صف بيانات (باستثناء الرؤوس)
    let row = data[i];
    let exchangeId = row[1];
    let symbol = row[2];
    let targetPrice = parseFloat(row[3]);
    let alertCondition = row[4];
    let telegramChatId = row[5];
    let status = row[6]; // العمود G في الشيت (Status)
    let requestTimeStr = row[7]; // العمود H في الشيت (Request Time)
    // عمود Last Checked هو row[8]

    // التنبيهات التي تعمل في الخلفية هي فقط تنبيهات Telegram النشطة
    if (status === "Active") {
      

      let requestTime = new Date(requestTimeStr);
      let timeDifferenceMs = currentTriggerTime.getTime() - requestTime.getTime();
      let timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));

      let interval;
      let limit;

      if (timeDifferenceMinutes <= 5) {
          // إذا كان الفارق 0-5 دقائق، استخدم شموع 1 دقيقة
          interval = '1m';
          limit = Math.max(1, timeDifferenceMinutes); // على الأقل شمعة واحدة
      } else {
          // إذا كان الفارق أكبر من 5 دقائق، استخدم شمعة 5 دقائق واحدة
          interval = '5m';
          limit = 1;
      }
      
      let candles = await fetchCandlestickData(exchangeId, symbol, interval, limit);
      let triggeredByHistoricalPrice = false;
      let actualTriggerPrice = null; // لتسجيل السعر الذي تسبب في التنبيه

      if (candles && candles.length > 0) {
          // إذا كانت الشموع 1m، يجب أن نفحص كل شمعة
          for (const candle of candles) {
            if (alertCondition === 'less_than_or_equal') {
                if (candle.low <= targetPrice) {
                    triggeredByHistoricalPrice = true;
                    actualTriggerPrice = candle.low;
                    break; // وجدنا التحقق، لا داعي لمواصلة الفحص
                }
            } else if (alertCondition === 'greater_than_or_equal') {
                if (candle.high >= targetPrice) {
                    triggeredByHistoricalPrice = true;
                    actualTriggerPrice = candle.high;
                    break; // وجدنا التحقق، لا داعي لمواصلة الفحص
                }
            }
          }
          
      } else {
           console.warn(`لم يتم الحصول على بيانات شمعة (${interval}, limit: ${limit}) لـ ${symbol} على ${EXCHANGES_CONFIG[exchangeId].name}. قد تكون حدود API أو عدم توفر البيانات.`);
      }

      if (triggeredByHistoricalPrice) {

          let message = `🔔 تنبيه سعر ${EXCHANGES_CONFIG[exchangeId].name}!\nعملة <b>${symbol}</b> بلغت <b>${actualTriggerPrice} USDT</b>. (الشرط: السعر ${alertCondition === 'less_than_or_equal' ? 'أقل من أو يساوي' : 'أعلى من أو يساوي'} ${targetPrice} USDT)`;
          let sendResult =await sendTelegramMessage(telegramChatId, message);

          if (sendResult.success) {
              let iPls = i+2
              dltRwApp.push(iPls)
              // بما أننا حذفنا الصف، يجب أن نقلل الفهرس لتجنب تخطي صفوف
              data.splice(i, 1); // إزالة الصف المحذوف من مصفوفة البيانات المحلية أيضًا
          } else {
              // إذا فشل الإرسال، لا تحذف التنبيه حتى يمكن المحاولة مرة أخرى لاحقًا
              console.error(`فشل إرسال إشعار تيليجرام لـ ${symbol}:`, sendResult.error);
              // يمكننا تعيين حالة التنبيه إلى "Failed" في الشيت إذا أردنا تتبع الأخطاء
              // sheet.getRange(i + 1, 7).setValue("Failed");
          }
      }
    }
  }
   let retour = await callFirebaseWithPost()
}

/**
 * دالة لجلب بيانات الشموع (OHLCV) من المنصة المحددة لفترة معينة.
 * @param {string} exchangeId - معرف المنصة.
 * @param {string} symbol - رمز العملة (مثال: BTCUSDT).
 * @param {string} interval - الفاصل الزمني للشمعة (مثال: '1m', '5m', '15m').
 * @param {number} limit - عدد الشموع المراد جلبها.
 * @returns {Array<Object> | null} مصفوفة من كائنات الشموع أو null في حالة الفشل.
 */
async function fetchCandlestickData(exchangeId, symbol, interval, limit) {
    const exchange = EXCHANGES_CONFIG[exchangeId];
    if (!exchange || !exchange.candlestickUrl || !exchange.parseCandle || !exchange.intervalMap[interval]) {
        console.error(`منصة ${exchangeId} لا تدعم جلب بيانات الشموع أو URL/parseCandle/intervalMap غير معرف لـ ${interval}.`);
        return null;
    }

    let apiUrl = '';
    const now = new Date();
    const endTimeMs = now.getTime();
    
    // لحساب وقت البدء لطلب الشمعة الأخيرة
    const intervalMs = parseIntervalToMilliseconds(interval);
    // نحدد وقت البدء لضمان الحصول على الشموع المطلوبة بالضبط
    // مثلاً: لو طلبنا 3 شموع 1m، نريد 3 دقائق من البيانات.
    const startTimeMs = endTimeMs - (intervalMs * limit); 

    try {
        let response, datas;
        let mappedInterval = exchange.intervalMap[interval];

        switch (exchangeId) {
            case 'binance':
                apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&interval=${mappedInterval}&limit=${limit}`;
                break;
            case 'kucoin':
                // KuCoin uses 'startAt' and 'endAt' in seconds
                apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&type=${mappedInterval}&startAt=${Math.floor(startTimeMs / 1000)}&endAt=${Math.floor(endTimeMs / 1000)}`;
                break;
            case 'coincap':
                // coincap v2 kline uses 'from' in seconds
                apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&interval=${mappedInterval}&limit=${limit}&from=${Math.floor(startTimeMs / 1000)}`;
                break;
            case 'coingecko':
                // coingecko v2 kline uses 'from' in seconds
                apiUrl = `${exchange.candlestickUrl}${symbol}/ohlc?vs_currency=usd&days=1`;
            break;
            case 'okx':
                // OKX uses 'before' and 'after' in milliseconds
                apiUrl = `${exchange.candlestickUrl}?instId=${symbol}&bar=${mappedInterval}`;
                break;
            default:
                console.warn(`جلب الشموع غير مدعوم للمنصة: ${exchangeId}`);
                return null;
        }
    
       
        //console.log(`apiUrl   is :${apiUrl}`)
        datas = (await axios.get(apiUrl)).data;

        //console.log(`datas ed data  is :`)
        //console.log(datas);
        
        let candles = [];
        if (exchangeId === 'binance') {
          candles = datas.map(exchange.parseCandle);
        }else if (exchangeId === 'kucoin') {
             if (datas.code === '200000' ) { 
                candles = datas.data.map(exchange.parseCandle);
            } else {
                console.error(`خطأ من ${exchange.name} API (شموع):`, datas.msg || JSON.stringify(datas));
            }
        }else if (  exchangeId === 'okx') { 
            if (datas.code === '200000' || datas.code === '0') {
                candles = datas.data.map(exchange.parseCandle);
            } else {
                console.error(`خطأ من ${exchange.name} API (شموع):`, datas.msg || JSON.stringify(datas));
            }
        } else if (exchangeId === 'coincap') {
            if (datas.ret_code === 0 && datas.result) {
                candles = datas.result.map(exchange.parseCandle);
            } else {
                console.error(`خطأ من ${exchange.name} API (شموع):`, datas.ret_msg || JSON.stringify(datas));
            }
        }else {
            if (Array.isArray(datas) && datas.length) {
                candles = datas.map(exchange.parseCandle);
            } else {
                console.error(`خطأ من ${exchange.name} API (شموع):`, JSON.stringify(datas));
            }
        }
        
        // قد ترجع المنصات شموعًا أكثر مما طلبناه، أو بترتيب معكوس.
        // للتأكد من الحصول على أحدث الشموع وحتى العدد المحدد.
        // غالبًا ما يتم إرجاعها بترتيب زمني تصاعدي (الأقدم أولاً).
        // إذا كان كذلك، نأخذ آخر 'limit' من الشموع.
        return candles.slice(-limit); 

    } catch (error) {
        console.error(`خطأ في جلب بيانات الشموع لـ ${symbol} من ${exchange.name}:`, error);
        return null;
    }
}

async function callFirebaseWithPost() {
    //console.log(responseAppScrpt);
    
 
  if (dltRwApp.length == 0) {return 'walo'}
  try {
    //const response = await axios.post(APPS_SCRIPT_WEB_APP_URL, options);
    await axios.post(APPS_SCRIPT_WEB_APP_URL, {
        action: 'okResponse',
        dltRw: dltRwApp
        },{
        headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error("error  respons", error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }

}
/**
 * دالة مساعدة لتحويل الفاصل الزمني النصي إلى مللي ثانية.
 */
function parseIntervalToMilliseconds(interval) {
    const value = parseInt(interval.slice(0, -1));
    const unit = interval.slice(-1);
    switch (unit) {
        case 'm': return value * 60 * 1000; // minutes
        case 'h': return value * 60 * 60 * 1000; // hours
        case 'd': return value * 24 * 60 * 60 * 1000; // days
        case 'w': return value * 7 * 24 * 60 * 60 * 1000; // weeks
        default: return 0; // Should not happen with defined intervals
    }
}



/**
 * دالة لإرسال رسالة Telegram.
 */
async function sendTelegramMessage(chatId, messageText) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "YOUR_TELEGRAM_BOT_TOKEN") {
    console.error("TELEGRAM_BOT_TOKEN غير معرّف أو غير صالح في Apps Script.");
    return { success: false, error: "توكن بوت تيليجرام غير موجود." };
  }
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  let payload = {
    chat_id: chatId,
    text: messageText,
    parse_mode: 'HTML'
  };

  try {
    const response = await axios.post(TELEGRAM_API_URL, payload);
        return { success: true, response: response.data };
    } catch (error) {
        console.error("خطأ في إرسال رسالة تيليجرام:", error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}





