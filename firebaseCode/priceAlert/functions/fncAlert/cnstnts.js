// ✅ 1. جعل الإعدادات ثابتاً عالمياً (Global Constant) لمرة واحدة فقط
// هذا يحمي الذاكرة من التضخم ويقلل وقت التنفيذ
export const EXCHANGES_CONFIG = {
    binance: {
        name: "Binance",
        tickerPriceUrl: "https://api.binance.com/api/v3/ticker/price",
        candlestickUrl: "https://api.binance.com/api/v3/klines",
        usdtSuffix: "USDT",
        parseCandle: c => ({
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
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5]),
        }),
        intervalMap: { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h" },
    },
    // ... أضف بقية المنصات بنفس الطريقة ...
};

/**
 * دالة جلب رابط الـ API
 */
export const gtapiUrl = (exchangeId, symbol, mappedInterval, limit) => {
    // التحقق من وجود الإعدادات للمنصة المطلوبة
    const exchange = EXCHANGES_CONFIG[exchangeId];
    
    if (!exchange) {
        console.warn(`⚠️ Exchange "${exchangeId}" is missing in EXCHANGES_CONFIG.`);
        return null;
    }

    let apiUrl;
    switch (exchangeId) {
        case "binance":
        case "mexc":
            apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&interval=${mappedInterval}&limit=${limit}`;
            break;
        case "kucoin":
            apiUrl = `${exchange.candlestickUrl}?type=${mappedInterval}&symbol=${symbol}&limit=${limit}`;
            break;
        case "okx":
            apiUrl = `${exchange.candlestickUrl}?instId=${symbol}&bar=${mappedInterval}&limit=${limit}`;
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
        case "coinbase":
            let ndt = new Date();
            const startDate = new Date(ndt.getTime() - 60 * 120 * 1000).toISOString().split(".")[0] + "Z";
            const endDate = new Date().toISOString().split(".")[0] + "Z";
            // تصحيح الرابط باستخدام التوظيف الصحيح للـ symbol
            apiUrl = `${exchange.tickerPriceUrl}${symbol}/candles?start=${startDate}&end=${endDate}&granularity=300`;
            break;
        default:
            console.warn(`❌ Exchange "${exchangeId}" logic not handled in switch.`);
            return null;
    }
    return apiUrl;
};