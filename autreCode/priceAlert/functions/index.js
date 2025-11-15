//const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");






admin.initializeApp();

// *** بيانات اعتماد Telegram Bot API (لا تنس تحديثها) ***
const TELEGRAM_BOT_TOKEN = "8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE";
 // احصل عليه من @BotFather
//const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || functions.config().telegram.token;


let dltRwApp = [];
let interval;
let limit;
//let { interval, limit } ={}
const APPS_SCRIPT_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbz0hE-JXd26WjQtLOwp3SZI5_x5ZETBZjWPxFutRyZiPMDn01khIam6tVxBanNl-O2s/exec";

exports.proxyRequest = onRequest(
    { region: "europe-west1" },
    async (req, res) => {
        const tabelAlert = req.method === "POST" ? req.body.datas : req.query.datas;
        res.send("cbn");
        let dd='dd'
        try {
            //const response = await axios.get(tabelAlert);
/* const urlAlrt = "https://api.binance.com/api/v3/ticker/24hr";

        const rslt = await axios.get(urlAlrt);
            let alrtTlgrm = rslt.data.filter(coin => parseFloat(coin.priceChangePercent) > 20 && coin.symbol.endsWith("USDT"));
            console.log('alrtTlgrm is :');
            console.log(alrtTlgrm);
            */


            if(!tabelAlert){ return null}
            checkAndSendAlerts(tabelAlert);
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
        tickerPriceUrl: "https://api.binance.com/api/v3/ticker/price",
        candlestickUrl: "https://api.binance.com/api/v3/klines", // نقطة نهاية الشموع
        usdtSuffix: "USDT",
        parseCandle: c => ({
            time: parseInt(c[0]),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5]),
        }),
        intervalMap: { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h" },
    },
    mexc: {
        name: "MEXC",
        tickerPriceUrl: "https://api.mexc.com/api/v3/ticker/price",
        candlestickUrl: "https://api.mexc.com/api/v3/klines",
        usdtSuffix: "USDT",
        parseCandle: c => ({
            time: parseInt(c[0]),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5]),
        }),
        intervalMap: { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h" },
    },
    kucoin: {
        name: "KuCoin",
        tickerPriceUrl: "https://api.kucoin.com/api/v1/market/orderbook/level1",
        candlestickUrl: "https://api.kucoin.com/api/v1/market/candles",
        usdtSuffix: "USDT",
        parseCandle: c => ({
            time: parseInt(c[0]) * 1000,
            open: parseFloat(c[1]),
            close: parseFloat(c[2]),
            high: parseFloat(c[3]),
            low: parseFloat(c[4]),
            volume: parseFloat(c[5]),
        }),
        intervalMap: { "1m": "1min", "5m": "5min", "15m": "15min", "1h": "1hour" },
    },
    coincap: {
        name: "CoinCap",
        tickerPriceUrl: "https://api.coincap.io/v2/public/tickers",
        candlestickUrl: "https://api.coincap.io/v2/public/kline",
        usdtSuffix: "USDT",
        parseCandle: c => ({
            time: parseInt(c.open_time) * 1000,
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close),
            volume: parseFloat(c.volume),
        }),
        intervalMap: { "1m": "1", "5m": "5", "15m": "15", "1h": "60" },
    },
    coingecko: {
        name: "CoinGecko",
        tickerPriceUrl: "https://api.coingecko.com/api/v3/coins/",
        candlestickUrl:
            "https://api.coingecko.com/api/v3/coins/",
        usdtSuffix: "USD",
        parseCandle: c => ({
            time: c[0],
            open: c[1],
            high: c[2],
            low: c[3],
            close: c[4],
        }),
        intervalMap: { "1m": "1", "5m": "5", "15m": "15", "1h": "60" },
    },
    okx: {
        name: "OKX",
        tickerPriceUrl: "https://www.okx.com/api/v5/market/tickers",
        candlestickUrl: "https://www.okx.com/api/v5/market/candles",
        usdtSuffix: "-USDT",
        parseCandle: c => ({
            time: parseInt(c[0]),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[6]),
        }),
        intervalMap: { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1H" },
    },
    bybit: {
        name: "Bybit",
        tickerPriceUrl: "https://api.bybit.com/v2/public/tickers",
        candlestickUrl: "https://api.bybit.com/v5/market/kline?category=linear",
        usdtSuffix: "USDT",
        parseCandle: c => ({
            time: parseInt(c[0]),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5]),
        }),
        intervalMap: { "1m": "1", "5m": "5", "15m": "15", "1h": "60" },
    },
    bitget: {
        name: "Bitget",
        tickerPriceUrl: "https://api.bitget.com/api/spot/v1/market/tickers",
        candlestickUrl: "https://api.bitget.com/api/v2/spot/market/candles",
        usdtSuffix: "USDT_SPBL",
        parseCandle: c => ({
            time: parseInt(c[0]),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5]),
        }),
        intervalMap: { "1m": "1min", "5m": "5min", "15m": "15min", "1h": "1H" },
    },
    lbank: {
        name: "LBank",
        tickerPriceUrl: "https://api.lbkex.com/v2/ticker.do", // للحصول على السعر الحالي
        candlestickUrl: "https://api.lbkex.com/v2/kline.do", // رابط الشموع
        usdtSuffix: "_usdt", // لاحظ استخدام (_) بدل من (USDT)
        parseCandle: c => ({
            //time: parseInt(c.timestamp), // timestamp in ms
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.latest),
            volume: parseFloat(c.vol),
        }),
        intervalMap: { "1m": "1min", "5m": "5min", "15m": "15min", "1h": "1hour" },
    },
    kraken: {
        name: "Kraken",
        tickerPriceUrl: "https://api.kraken.com/0/public/OHLC",
        candlestickUrl: "https://api.kraken.com/0/public/Ticker",
        usdtSuffix: "USDT", // في Kraken يتم تسعير USDT مقابل الدولار فعليًا
        parseCandle: c => ({
            //time: new Date(c[0] * 1000),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5]),
        }),
        intervalMap: {
            "1m": 1,
            "5m": 5,
            "15m": 15,
            "30m": 30,
            "1h": 60,
            "4h": 240,
            "1d": 1440,
            "1w": 10080,
            "15d": 21600,
        },
    },
    gateio: {
        name: "Gate.io",
        tickerPriceUrl: "https://api.gate.io/api/v4/spot/tickers",
        candlestickUrl: "https://api.gate.io/api/v4/spot/candlesticks",
        usdtSuffix: "_USDT",
        parseCandle: c => ({
            time: parseInt(c[0]) * 1000,
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5]),
        }),
        intervalMap: { "1m": "60", "5m": "300", "15m": "900", "1h": "3600" },
    },
    coinbase: {
        name: "Coinbase",
        tickerPriceUrl: "https://api.exchange.coinbase.com/products/",
        candlestickUrl:
            "https://api.exchange.coinbase.com/products/{symbol}/candles",
        usdtSuffix: "-USDT",
        parseCandle: c => ({
            time: c[0] * 1000,
            low: parseFloat(c[1]),
            high: parseFloat(c[2]),
            open: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5]),
        }),
        intervalMap: { "1m": "60", "5m": "300", "15m": "900", "1h": "3600" },
    },
};
function getIntLmt(requestTimeStr) {
    const currentTriggerTime = new Date(); // وقت تشغيل الـ Trigger الحالي
    let requestTime = new Date(requestTimeStr);
    let timeDifferenceMs = currentTriggerTime.getTime() - requestTime.getTime();
    let timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));

    let intervall;
    let limitt;

    if (timeDifferenceMinutes <= 5) {
        // إذا كان الفارق 0-5 دقائق، استخدم شموع 1 دقيقة
        intervall = "1m";
        limitt = Math.max(1, timeDifferenceMinutes); // على الأقل شمعة واحدة
    } else {
        // إذا كان الفارق أكبر من 5 دقائق، استخدم شمعة 5 دقائق واحدة
        intervall = "5m";
        limitt = 1;
    }
    return { intervall, limitt };
}

async function fltrCrpto(dts) {
    let dt =[];
    let allRequestTimeStr = [];
    let allCpts = {};
    let candles = {};
    let rpl = [];
    let rplcSmbl = {
        kucoin: [],
        coinGecko: [],
        okx: [],
        lbank: [],
        coinbase: [],
    };
    // تحويل جميع العملات المتشابهة في منصة واحدة
    for (let i = 0; i < dts.length; i++) {
        let row = dts[i];
         rpl = [row[2]];
        allRequestTimeStr.push(row[7]);
        if (row[1] == "kucoin" || row[1] == "okx" || row[1] == "coinbase") {
            row[2] = row[2].replace("-", "");
            rplSmblFn(row[1],row[2])
        } else if (row[1] == "coinGecko") {
            row[2] = row[2].toUpperCase() + "USDT";
            rplSmblFn(row[1],row[2])
        } else if (row[1] == "lbank") {
            row[2] = row[2].replace("_", "");
            rplSmblFn(row[1],row[2])
        }
        if (row[1] == "binance" && !allCpts[row[2]]) {
            allCpts[row[2]] = "binance";
        }
        dt.push(row) ;
    }
function rplSmblFn(row1,row2) {rpl.push(row2);rplcSmbl[row1].push(rpl);}
    dt.forEach(el => {
        if (!allCpts[el[2]]) {
            allCpts[el[2]] = el[1];
        }
    });
    /* dt.forEach(row => {
        row[1] = allCpts
    }); */

    let rzltAry = Object.entries(allCpts);

    rzltAry.forEach(el => {
        if (rplcSmbl[el[1]]) {
            rplcSmbl[el[1]].forEach(rpl => {
                if (rpl[1] == el[0]) {
                    el[0] = rpl[0];
                }
            });
        }
    });
    // => rzltAry = [["BTC","binance"],["eth","kucoin"]...]

    for (let i = 0; i < rzltAry.length; i++) {
        const exchangeId = rzltAry[i][1];
        const symbol = rzltAry[i][0];
        let requestTimeStr = allRequestTimeStr[i]; // العمود H في الشيت (Request Time)
        // عمود Last Checked هو row[8]
        let intLmt = getIntLmt(requestTimeStr);
        interval = intLmt.intervall;
        limit = intLmt.limitt;
        const candle = await fetchCandlestickData(
            exchangeId,
            symbol,
            interval,
            limit
        );
        candles[symbol] = candle;
    }
    return candles;
}

async function checkAndSendAlerts(data) {
    let inpt =JSON.stringify(data)
    const rsltcandles = await fltrCrpto(data);
    inpt =	JSON.parse(inpt);
    // نتكرر على الصفوف من الأسفل للأعلى لسهولة الحذف
    for (let i = inpt.length - 1; i >= 0; i--) {
        // البدء من آخر صف بيانات (باستثناء الرؤوس)
        const row = inpt[i];
        const exchangeId = row[1];
        const symbol = row[2];
        const targetPrice = parseFloat(row[3]);
        const alertCondition = row[4];
        const telegramChatId = row[5];
        //const status = row[6]; // العمود G في الشيت (Status)
        //const requestTimeStr = row[7]; // العمود H في الشيت (Request Time)
        // عمود Last Checked هو row[8]

        const candles = rsltcandles[symbol];
        
        let triggeredByHistoricalPrice = false;
        let actualTriggerPrice = null; // لتسجيل السعر الذي تسبب في التنبيه

        if (candles && candles.length > 0) {
            // إذا كانت الشموع 1m، يجب أن نفحص كل شمعة
            for (const candle of candles) {
                if (alertCondition === "less_than_or_equal") {
                    if (candle.low <= targetPrice) {
                        triggeredByHistoricalPrice = true;
                        actualTriggerPrice = candle.low;
                        break; // وجدنا التحقق، لا داعي لمواصلة الفحص
                    }
                } else if (alertCondition === "greater_than_or_equal") {
                    if (candle.high >= targetPrice) {
                        triggeredByHistoricalPrice = true;
                        actualTriggerPrice = candle.high;
                        break; // وجدنا التحقق، لا داعي لمواصلة الفحص
                    }
                }
            }
        } else {
            console.warn(
                `لم يتم الحصول على بيانات شمعة (${interval}, limit: ${limit}) لـ ${symbol} على ${EXCHANGES_CONFIG[exchangeId].name}. قد تكون حدود API أو عدم توفر البيانات.`
            );
        }

        if (triggeredByHistoricalPrice) {
            let message = `🔔 تنبيه سعر ${
                EXCHANGES_CONFIG[exchangeId].name
            }!\nعملة <b>${symbol}</b> بلغت <b>${actualTriggerPrice} USDT</b>. (الشرط: السعر ${
                alertCondition === "less_than_or_equal"
                    ? "أقل من أو يساوي"
                    : "أعلى من أو يساوي"
            } ${targetPrice} USDT)`;
            let sendResult = await sendTelegramMessage(telegramChatId, message);

            if (sendResult.success) {
                let iPls = i + 2;
                dltRwApp.push(iPls);

                // بما أننا حذفنا الصف، يجب أن نقلل الفهرس لتجنب تخطي صفوف
                inpt.splice(i, 1); // إزالة الصف المحذوف من مصفوفة البيانات المحلية أيضًا
            } else {
                // إذا فشل الإرسال، لا تحذف التنبيه حتى يمكن المحاولة مرة أخرى لاحقًا
                console.error(
                    `فشل إرسال إشعار تيليجرام لـ ${symbol}:`,
                    sendResult.error
                );
                // يمكننا تعيين حالة التنبيه إلى "Failed" في الشيت إذا أردنا تتبع الأخطاء
                // sheet.getRange(i + 1, 7).setValue("Failed");
            }
        }
    }
    let retour = await callFirebaseWithPost();
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
    if (
        !exchange ||
        !exchange.candlestickUrl ||
        !exchange.parseCandle ||
        !exchange.intervalMap[interval]
    ) {
        console.error(
            `منصة ${exchangeId} لا تدعم جلب بيانات الشموع أو URL/parseCandle/intervalMap غير معرف لـ ${interval}.`
        );
        return null;
    }
    symbol = symbol.replace("$", "");
    let apiUrl = "";
    const now = new Date();
    const endTimeMs = now.getTime();

    // لحساب وقت البدء لطلب الشمعة الأخيرة
    const intervalMs = parseIntervalToMilliseconds(interval);
    // نحدد وقت البدء لضمان الحصول على الشموع المطلوبة بالضبط
    // مثلاً: لو طلبنا 3 شموع 1m، نريد 3 دقائق من البيانات.
    const startTimeMs = endTimeMs - intervalMs * limit;

    try {
        let response, datas;
        let mappedInterval = exchange.intervalMap[interval];
        console.log("interval is : ");
        console.log(interval);
        console.log("mappedInterval is : " + mappedInterval);

        switch (exchangeId) {
            case "binance":
                apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&interval=${mappedInterval}&limit=${limit}`;
                break;
            case "mexc":
                apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&interval=${mappedInterval}&limit=${limit}`;
                break;

            case "kucoin":
                apiUrl = `${exchange.candlestickUrl}?type=${mappedInterval}&symbol=${symbol}&limit=${limit}`;
                break;

            case "okx":
                apiUrl = `${exchange.candlestickUrl}?instId=${symbol}&bar=${mappedInterval}&limit=${limit}`;
                /* https://www.okx.com/api/v5/market/candles?instId=1INCH-USDT&bar=1m&limit=1
                &before=${endTimeMs}&after=${startTimeMs} */
                break;

            case "coingecko":
                const url = exchange.candlestickUrl+ symbol +'/market_chart';
                const params = new URLSearchParams({
                    vs_currency: "usd",
                    days: "1", // هذا يعيد بيانات محدثة كل 5 دقائق تقريبا
                });
                apiUrl = `${url}?${params}`;

                break;

            case "coincap":
                apiUrl = `${exchange.candlestickUrl}?exchange=${symbol}&interval=${mappedInterval}&baseSymbol=${symbol}&quoteSymbol=USDT`;
                break;

            case "bybit":
                apiUrl = `${exchange.candlestickUrl}&symbol=${symbol}&interval=${mappedInterval}&limit=${limit}`;
                break;

            case "bitget":
                apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&granularity=${mappedInterval}&limit=${limit}`;
                break;
            case "lbank":
                apiUrl = `${exchange.tickerPriceUrl}?symbol=${symbol}&size=${limit}&type=${mappedInterval}`;
                break;
            case "kraken":
                apiUrl = `${exchange.tickerPriceUrl}?pair=${symbol}&interval=1`;
                break;
            /* case "gateio":
                apiUrl = `${exchange.candlestickUrl}?currency_pair=${symbol}${exchange.usdtSuffix}&interval=${mappedInterval}&limit=${limit}`;
                break; */

            case "coinbase" /* https://api.exchange.coinbase.com/products/BTC-USD/candles?start=2025-08-03T19:00:00Z&end=2025-08-03T20:00:00Z&granularity=300 */:
                let ndt = new Date();
                const startDate =
                    new Date(ndt.getTime() - 60 * 120 * 1000)
                        .toISOString()
                        .split(".")[0] + "Z";
                const endDate = new Date().toISOString().split(".")[0] + "Z";
                apiUrl = `${exchange.tickerPriceUrl}${symbol}/candles?start=${startDate}&end=${endDate}&granularity=300`;
                break;

            default:
                console.warn(`Exchange "${exchangeId}" not handled.`);
                return null;
        }

        console.log(`apiUrl   is :${apiUrl}`);
        datas = (await axios.get(apiUrl)).data;


        let candles = [];

        if (exchangeId === "binance") {
            candles = datas.map(exchange.parseCandle);
            /* console.log(`candles  is :`);
            console.log(candles); */
        } else if (exchangeId === "kucoin") {
            if (datas.code === "200000") {
                let data2= datas.data.map(exchange.parseCandle);
                for (let i = 0; i < limit; i++) {
                    candles.push(data2[i])
                }
            } else {
                console.error(
                    `خطأ من ${exchange.name} API (شموع):`,
                    datas.msg || JSON.stringify(datas)
                );
            }
        } else if (exchangeId === "okx") {
            if (datas.code === "200000" || datas.code === "0") {
                candles = datas.data.map(exchange.parseCandle);
            } else {
                console.error(
                    `خطأ من ${exchange.name} API (شموع):`,
                    datas.msg || JSON.stringify(datas)
                );
            }
        } else if (exchangeId === "bybit") {
            candles = datas.result.list.map(exchange.parseCandle);
            /* console.log(candles); */
        } else if (exchangeId === "bitget") {
            candles = datas.data.map(exchange.parseCandle);
            /* console.log('datas.result.list'); */

            /* console.log(candles); */
        } else if (exchangeId === "lbank") {
            candles = [datas.data[0].ticker].map(exchange.parseCandle);
            console.log("datas talya :");

            console.log(candles);
        } else if (exchangeId === "coincap") {
            if (datas.ret_code === 0 && datas.result) {
                candles = datas.result.map(exchange.parseCandle);
            } else {
                console.error(
                    `خطأ من ${exchange.name} API (شموع):`,
                    datas.ret_msg || JSON.stringify(datas)
                );
            }
        } else if (exchangeId === "coingecko") {
            const now = Date.now();
            const fiveMinutesAgo = now - 5 * 60 * 1000;

            // تصفية الأسعار في آخر 5 دقائق
            const pricesLast5Min = datas.prices.filter(
                item => item[0] >= fiveMinutesAgo
            );

            const open = pricesLast5Min[0][1];
            const close = pricesLast5Min[pricesLast5Min.length - 1][1];
            const high = Math.max(...pricesLast5Min.map(p => p[1]));
            const low = Math.min(...pricesLast5Min.map(p => p[1]));
            datas = [
                [new Date(pricesLast5Min[0][0]).toISOString(), open, high, low, close],
            ];

            candles = datas.map(exchange.parseCandle);
        } else if (exchangeId === "kraken") {
            let lmtSlc = mappedInterval * limit;
            let dtSlc = datas.result[symbol].slice(0, lmtSlc);
            console.log("dtSlc is :" + dtSlc);

            candles = dtSlc.map(exchange.parseCandle);
            console.log("candles talya is :");
            console.log(candles);
        } else if (exchangeId === "coinbase") {
            if (datas) {
                let lastTim = 0;
                let indData = 0;
                datas.forEach((e, ind) => {
                    if (e[0] > lastTim) {
                        lastTim = e[0];
                        indData = ind;
                    }
                });
                let dtSlc = [datas[indData]];
                candles = dtSlc.map(exchange.parseCandle);
            }
        } else {
            if (Array.isArray(datas) && datas.length) {
                candles = datas.map(exchange.parseCandle);
            } else {
                console.error(
                    `خطأ من ${exchange.name} API (شموع):`,
                    JSON.stringify(datas)
                );
            }
        }
        /* if (exchangeId === "coingecko") candles = datas.prices;
        else if (exchangeId === "bitget") candles = datas.data;
        else if (exchangeId === "gateio") candles = datas.data;
        else if (exchangeId === "coinbase") candles = datas;
        else candles = datas; */
        // قد ترجع المنصات شموعًا أكثر مما طلبناه، أو بترتيب معكوس.
        // للتأكد من الحصول على أحدث الشموع وحتى العدد المحدد.
        // غالبًا ما يتم إرجاعها بترتيب زمني تصاعدي (الأقدم أولاً).
        // إذا كان كذلك، نأخذ آخر 'limit' من الشموع.
        console.log('candles is : ');
        console.log(candles);
        let candles2 = candles.slice(-limit);
        console.log('candles2 is : ');
        console.log(candles2);
        return candles2
    } catch (error) {
        console.error(
            //${symbol}
            `خطأ في جلب بيانات الشموع لـ  من ${exchange.name}:`,
            error
        );
        return null;
    }
}

async function callFirebaseWithPost() {
    console.log('fat mna');
    if (dltRwApp.length == 0) {
        return "walo";
    }
    console.log("fast mnhak dltRwApp : " + dltRwApp);

    try {
        //const response = await axios.post(APPS_SCRIPT_WEB_APP_URL, options);
        await axios.post(
            APPS_SCRIPT_WEB_APP_URL,
            {
                action: "okResponse",
                dltRw: dltRwApp,
            },
            {
                headers: { "Content-Type": "application/json" },
            }
        );
        dltRwApp = [];
    } catch (error) {
        console.error(
            "error  respons",
            error.response ? error.response.data : error.message
        );
        return {
            success: false,
            error: error.response ? error.response.data : error.message,
        };
    }
}
/**
 * دالة مساعدة لتحويل الفاصل الزمني النصي إلى مللي ثانية.
 */
function parseIntervalToMilliseconds(interval) {
    const value = parseInt(interval.slice(0, -1));
    const unit = interval.slice(-1);
    switch (unit) {
        case "m":
            return value * 60 * 1000; // minutes
        case "h":
            return value * 60 * 60 * 1000; // hours
        case "d":
            return value * 24 * 60 * 60 * 1000; // days
        case "w":
            return value * 7 * 24 * 60 * 60 * 1000; // weeks
        default:
            return 0; // Should not happen with defined intervals
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
        parse_mode: "HTML",
    };

    try {
        const response = await axios.post(TELEGRAM_API_URL, payload);
        return { success: true, response: response.data };
    } catch (error) {
        console.error(
            "خطأ في إرسال رسالة تيليجرام:",
            error.response ? error.response.data : error.message
        );
        return {
            success: false,
            error: error.response ? error.response.data : error.message,
        };
    }
}
