// functions/config.js

// **هام:** استخدم Firebase Functions Environment Configuration لتخزين التوكنات الحساسة بأمان.
// مثال لكيفية تعيين التوكن باستخدام Firebase CLI:
// firebase functions:config:set telegram.bot_token="YOUR_TELEGRAM_BOT_TOKEN_HERE"
// يمكنك الوصول إليه في وظائفك كـ: functions.config().telegram.bot_token
// أثناء التطوير المحلي، يمكن تعيينه مباشرة للاختبار، ولكن غيّر هذا في الإنتاج.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || functions.config().telegram?.bot_token || 'YOUR_TELEGRAM_BOT_TOKEN_PLACEHOLDER';


// إعدادات واجهات API لمنصات التداول
const EXCHANGES_CONFIG = {
    binance: {
        name: "Binance",
        tickerPriceUrl: 'https://api.binance.com/api/v3/ticker/price',
        candlestickUrl: 'https://api.binance.com/api/v3/klines',
        usdtSuffix: 'USDT',
        parseCandle: (c) => ({
            time: parseInt(c[0]), open: parseFloat(c[1]), high: parseFloat(c[2]),
            low: parseFloat(c[3]), close: parseFloat(c[4]), volume: parseFloat(c[5])
        }),
        intervalMap: { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h' }
    },
    kucoin: {
        name: "KuCoin",
        tickerPriceUrl: 'https://api.kucoin.com/api/v1/market/orderbook/level1',
        candlestickUrl: 'https://api.kucoin.com/api/v1/market/candles',
        usdtSuffix: 'USDT',
        parseCandle: (c) => ({
            time: parseInt(c[0]) * 1000, open: parseFloat(c[1]), close: parseFloat(c[2]),
            high: parseFloat(c[3]), low: parseFloat(c[4]), volume: parseFloat(c[5])
        }),
        intervalMap: { '1m': '1min', '5m': '5min', '15m': '15min', '1h': '1hour' }
    },
    coincap: {
        name: "CoinCap",
        tickerPriceUrl: 'https://api.coincap.io/v2/assets',
        // CoinCap لا توفر OHLC مباشرة بنفس سهولة الباقين، لذا قد لا تعمل الشموع هنا
        // أو تتطلب معالجة إضافية. تم تبسيط الإعداد.
        // parseCandle و intervalMap قد لا تكون ذات صلة هنا.
    },
    coingecko: {
        name: "CoinGecko",
        tickerPriceUrl: 'https://api.coingecko.com/api/v3/simple/price',
        candlestickUrl: 'https://api.coingecko.com/api/v3/coins/', // requires {id}/ohlc
        usdtSuffix: 'usd',
        parseCandle: (c) => ({
             time: c[0], open: c[1], high: c[2], low: c[3], close: c[4]
        }),
        // CoinGecko OHLC API يستخدم 'days' كمعامل للفاصل الزمني.
        intervalMap: { '1m': '1', '5m': '1', '15m': '1', '1h': '7' } // أيام لـ CoinGecko OHLC
    },
    okx: {
        name: "OKX",
        tickerPriceUrl: 'https://www.okx.com/api/v5/market/tickers',
        candlestickUrl: 'https://www.okx.com/api/v5/market/candles',
        usdtSuffix: '-USDT',
        parseCandle: (c) => ({
            time: parseInt(c[0]), open: parseFloat(c[1]), high: parseFloat(c[2]),
            low: parseFloat(c[3]), close: parseFloat(c[4]), volume: parseFloat(c[6])
        }),
        intervalMap: { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1H' }
    }
};

// خريطة لربط رموز العملات بـ CoinGecko IDs (مطلوبة لـ CoinGecko API)
const COINGECKO_ID_MAP = {
    "BTCUSDT": "bitcoin",
    "ETHUSDT": "ethereum",
    "BNBUSDT": "binancecoin",
    "SOLUSDT": "solana",
    "XRPUSDT": "ripple",
    "ADAUSDT": "cardano",
    "DOGEUSDT": "dogecoin"
    // أضف المزيد حسب الحاجة للرموز التي تستخدمها
};

module.exports = {
    TELEGRAM_BOT_TOKEN,
    EXCHANGES_CONFIG,
    COINGECKO_ID_MAP
};