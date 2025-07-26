/* firebase code */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

admin.initializeApp();

exports.proxyRequest = onRequest(
  { region: "europe-west1" },
  async (req, res) => {
    const baseUrl = req.method === "POST" ? req.body.url : req.query.url;

    if (!baseUrl) {
      return res
        .status(400)
        .json({ error: "The 'url' parameter is required." });
    }

    try {
      const response = await axios.get(baseUrl);

      // إذا كان الرد يحتوي على HTML بدل JSON
      if (typeof response.data === "string" && response.data.startsWith("<")) {
        return res.status(500).json({
          error: "Received HTML instead of JSON (possibly blocked or invalid URL).",
          raw: response.data.slice(0, 1000),
        });
      }

      // إرسال البيانات كـ JSON
      return res.status(200).json(response.data);
    } catch (error) {
      logger.error("Axios error:", error.message);
      return res.status(500).json({
        error: "Failed to fetch data",
        details: error.message,
      });
    }
  }
);






/////////////////////////////////////////
//////////////////////////////////////:/
/////////////////////////////////////////


/* apps script code */

/* ntaw3i */
let idChatT =  "غير معروف";
function doGet(e) {
  let data = {} ;
   // قراءة المعطيات
   if(e.parameter.action == "getId"){
   idChatT = e.parameter.idChat ;
  
     data = {
      alerts : alertsChtIdOfTable(idChatT)
    }
  }


 return ContentService.createTextOutput(JSON.stringify(data))
}



// *** بيانات اعتماد Telegram Bot API (لا تنس تحديثها) ***
const TELEGRAM_BOT_TOKEN = "8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE"; // احصل عليه من @BotFather
// اسم ورقة العمل التي ستخزن فيها التنبيهات
const ALERTS_SHEET_NAME = "Sheet1"; // تأكد من مطابقة هذا لاسم ورقتك
let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ALERTS_SHEET_NAME);
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
        tickerPriceUrl: 'https://www.okx.com/api/v5/market/tickers?instType=SPOT',
        candlestickUrl: 'https://www.okx.com/api/v5/market/candles?instType=SPOT',
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


/**
 * دالة doPost: تستقبل الطلبات من الواجهة الأمامية (تعيين/حذف التنبيهات)
 * وتستقبل تحديثات Webhook من Telegram.
 */
function doPost(e) {
  let result = {};
  try {
    let data = JSON.parse(e.postData.contents);

     // الطلب قادم من الواجهة الأمامية (تعيين/حذف التنبيه)
      let action = data.action;
      

      if (action == 'setAlert') {
        let alertId = data.id;
        let exchangeId = data.exchangeId;
        let symbol = data.symbol;
        let targetPrice = data.targetPrice;
        let alertCondition = data.alertCondition;
        let telegramChatId = data.telegramChatId || '';
        let requestTime = new Date().toLocaleString(); // تسجيل وقت الطلب

        if (!alertId || !exchangeId || !symbol || !targetPrice || !telegramChatId || !alertCondition) {
          result.status = "error";
          result.message = "الرجاء توفير جميع البيانات المطلوبة لتعيين تنبيه تيليجرام.";
          return ContentService.createTextOutput(JSON.stringify(result))
        }
        if (!alertId || !exchangeId || !symbol || !targetPrice || !telegramChatId || !alertCondition) {
          result.status = "error";
          result.message = "الرجاء توفير جميع البيانات المطلوبة لتعيين تنبيه تيليجرام.";
          return ContentService.createTextOutput(JSON.stringify(result))
        }

        let existingRow = findAlertRowById(sheet, alertId);

     /*    if (existingRow) {
          // Update existing alert (though in this model, alerts are deleted after triggering)
          sheet.getRange(existingRow, 1).setValue(alertId);
          sheet.getRange(existingRow, 2).setValue(exchangeId);
          sheet.getRange(existingRow, 3).setValue(symbol);
          sheet.getRange(existingRow, 4).setValue(targetPrice);
          sheet.getRange(existingRow, 5).setValue(alertCondition);
          sheet.getRange(existingRow, 6).setValue(telegramChatId);
          sheet.getRange(existingRow, 7).setValue("Active"); // حالة التنبيه
          sheet.getRange(existingRow, 8).setValue(requestTime); // تحديث وقت الطلب
          sheet.getRange(existingRow, 9).setValue("N/A"); // آخر فحص
          result.message = "تم تحديث التنبيه الموجود بنجاح.";
        } else { */
          // إضافة عمود جديد لوقت الطلب (العمود H) قبل عمود آخر فحص (العمود I)
          sheet.appendRow([alertId, exchangeId, symbol, targetPrice, alertCondition, telegramChatId, "Active", requestTime, "N/A"]);
          result.message = "تم تعيين تنبيه جديد بنجاح.";
        /* } */
        result.status = "success";

      } else if (action === 'deleteAlert') {
        let alertIdToDelete = data.id;

        if (!alertIdToDelete) {
          result.status = "error";
          result.message = "الرجاء توفير معرف التنبيه للحذف.";
          return ContentService.createTextOutput(JSON.stringify(result))
        }

        let rowToDelete = findAlertRowById(sheet, alertIdToDelete);
        if (rowToDelete) {
          sheet.deleteRow(rowToDelete);
          result.status = "success";
          result.message = "تم حذف التنبيه بنجاح.";
        } else {
          result.status = "error";
          result.message = "لم يتم العثور على التنبيه للحذف.";
        }

      } else {
        result.status = "error";
        result.message = "إجراء غير معروف.";
      }
    
  } catch (error) {
    result.status = "error";
    result.message = "حدث خطأ في معالجة الطلب: " + error.toString();
    console.error("خطأ في doPost (Apps Script):", error);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
}

/**
 * تبحث عن صف التنبيه بمعرفه الفريد (ID).
 */
function findAlertRowById(sheet, id) {
  let data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      return i + 1; // ترجع رقم الصف (مبني على 1)
    }
  }
  return null;
}

/**
 * دالة لجلب بيانات الشموع (OHLCV) من المنصة المحددة لفترة معينة.
 * @param {string} exchangeId - معرف المنصة.
 * @param {string} symbol - رمز العملة (مثال: BTCUSDT).
 * @param {string} interval - الفاصل الزمني للشمعة (مثال: '1m', '5m', '15m').
 * @param {number} limit - عدد الشموع المراد جلبها.
 * @returns {Array<Object> | null} مصفوفة من كائنات الشموع أو null في حالة الفشل.
 */
function fetchCandlestickData(exchangeId, symbol, interval, limit) {
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
        let response, data;
        let mappedInterval = exchange.intervalMap[interval];
        switch (exchangeId) {
            case 'binance':
                apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&interval=${mappedInterval}&limit=${limit}`;
                Logger.log(apiUrl)
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
                apiUrl = `${exchange.candlestickUrl}?${coinId}/ohlc?vs_currency=usd&days=1`;
            break;
            case 'okx':
                // OKX uses 'before' and 'after' in milliseconds
                apiUrl = `${exchange.candlestickUrl}&instId=${symbol}&bar=${mappedInterval}&limit=${limit}&before=${endTimeMs}&after=${startTimeMs}`;
                break;
            default:
                console.warn(`جلب الشموع غير مدعوم للمنصة: ${exchangeId}`);
                return null;
        }


        function callFirebaseWithPost() {
          const payload = {
            url: apiUrl
          };

          const options = {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          };

 
          const url = "https://proxyrequest-kuwu5xovza-ew.a.run.app";
          response = UrlFetchApp.fetch(url, options);

          data = JSON.parse(response.getContentText());
 
 
        }
        callFirebaseWithPost() 

        let candles = [];
         if (exchangeId === 'kucoin' || exchangeId === 'okx') { // These return nested data structure
            if (data.code === '200000' || data.code === '0') {
              console.log(data.data.map(exchange.parseCandle));
                candles = data.data.map(exchange.parseCandle);
            } else {
                console.error(`خطأ من ${exchange.name} API (شموع):`, data.msg || JSON.stringify(data));
            }
        } else if (exchangeId === 'coincap') {
            if (data.ret_code === 0 && data.result) {
                candles = data.result.map(exchange.parseCandle);
            } else {
                console.error(`خطأ من ${exchange.name} API (شموع):`, data.ret_msg || JSON.stringify(data));
            }
        }else if (exchangeId === 'coingecko') {
            if (Array.isArray(data) && data.length) {
                candles = data.map(exchange.parseCandle);
            } else {
                console.error(`خطأ من ${exchange.name} API (شموع):`, JSON.stringify(data));
            }
        } else { // Binance returns direct array
            candles = data.map(exchange.parseCandle);
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
function sendTelegramMessage(chatId, messageText) {
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

  let options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    let response = UrlFetchApp.fetch(TELEGRAM_API_URL, options);
    let responseCode = response.getResponseCode();
    let responseText = response.getContentText();
    console.log(`استجابة تيليجرام (${responseCode}):`, responseText);

    if (responseCode === 200) {
      return { success: true, response: JSON.parse(responseText) };
    } else {
      return { success: false, error: `خطأ ${responseCode}: ${responseText}` };
    }
  } catch (error) {
    console.error("خطأ في إرسال رسالة تيليجرام:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * دالة checkAndSendAlerts: هذه الدالة هي التي ستعمل كـ "المراقب" وتُشغل بواسطة Trigger.
 * ستفحص التنبيهات في الشيت وترسلها إذا لزم الأمر، ثم تحذف التنبيه.
 */
function checkAndSendAlerts() {
  let data = sheet.getDataRange().getValues(); // جلب كل البيانات
  const currentTriggerTime = new Date(); // وقت تشغيل الـ Trigger الحالي

  // نتكرر على الصفوف من الأسفل للأعلى لسهولة الحذف
  for (let i = data.length - 1; i >= 1; i--) { // البدء من آخر صف بيانات (باستثناء الرؤوس)
    let row = data[i];
    let alertId = row[0];
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
      // قم بتحديث وقت آخر فحص
      sheet.getRange(i + 1, 9).setValue(new Date().toLocaleString()); // العمود I

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
      
      console.log(`فحص ${symbol} على ${EXCHANGES_CONFIG[exchangeId].name}. وقت الطلب: ${requestTimeStr}, وقت الـ Trigger: ${currentTriggerTime.toLocaleString()}. الفرق: ${timeDifferenceMinutes} دقيقة. جلب ${limit} شمعة من نوع ${interval}.`);

      let candles = fetchCandlestickData(exchangeId, symbol, interval, limit);
      let triggeredByHistoricalPrice = false;
      let actualTriggerPrice = null; // لتسجيل السعر الذي تسبب في التنبيه

      if (candles && candles.length > 0) {
          // إذا كانت الشموع 1m، يجب أن نفحص كل شمعة
          for (const candle of candles) {
            if (alertCondition === 'less_than_or_equal') {
                if (candle.low >= targetPrice) {
                    triggeredByHistoricalPrice = true;
                    actualTriggerPrice = candle.low;
                    break; // وجدنا التحقق، لا داعي لمواصلة الفحص
                }
            } else if (alertCondition === 'greater_than_or_equal') {
                if (candle.high <= targetPrice) {
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
          console.log(`تنبيه! ${symbol} على ${EXCHANGES_CONFIG[exchangeId].name} وصل إلى ${actualTriggerPrice} (أدنى/أعلى سعر في الشمعة). المستهدف: ${targetPrice}, الشرط: ${alertCondition}. إرسال إشعار تيليجرام...`);

          let message = `🔔 تنبيه سعر ${EXCHANGES_CONFIG[exchangeId].name}!\nعملة <b>${symbol}</b> بلغت <b>${actualTriggerPrice} USDT</b>. (الشرط: السعر ${alertCondition === 'less_than_or_equal' ? 'أقل من أو يساوي' : 'أعلى من أو يساوي'} ${targetPrice} USDT)`;
          let sendResult = sendTelegramMessage(telegramChatId, message);

          if (sendResult.success) {
              sheet.deleteRow(i + 1); // حذف الصف بعد إرسال التنبيه
              console.log(`تم إرسال إشعار تيليجرام لـ ${symbol} وحذف التنبيه بنجاح.`);
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
}





/**
 * دالة مساعدة لجلب التنبيهات النشطة من الشيت لعرضها في الواجهة الأمامية.
 */
function alertsChtIdOfTable(id) {
    let data = sheet.getDataRange().getValues();
    let alertsToDisplay = [];

    // رؤوس الأعمدة المتوقعة: ID, Exchange, Symbol, Target Price, Alert Condition, Telegram Chat ID, Status, Request Time, Last Checked
    // الصفوف تبدأ من 1 (بعد الرؤوس)
    for (let i = 1; i < data.length; i++) {
        let row = data[i];
        if (row[5] == id) { // التحقق من عمود Status (G)
            alertsToDisplay.push({
                id: row[0],
                exchangeId: row[1],
                symbol: row[2],
                targetPrice: row[3],
                alertCondition: row[4],
                telegramChatId: row[5],
                alertType: 'telegram' // دائما 'telegram' هنا لأننا لا نحفظ تنبيهات المتصفح
            });
        }
    }
    return alertsToDisplay;
}