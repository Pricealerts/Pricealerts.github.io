// functions/utils/exchangeApi.js
const axios = require('axios');
const { EXCHANGES_CONFIG, COINGECKO_ID_MAP } = require('../config');

/**
 * دالة مساعدة لتحويل الفاصل الزمني النصي إلى مللي ثانية.
 */
function parseIntervalToMilliseconds(interval) {
    const value = parseInt(interval.slice(0, -1));
    const unit = interval.slice(-1).toLowerCase();
    switch (unit) {
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        case 'w': return value * 7 * 24 * 60 * 60 * 1000;
        default: return 0;
    }
}

/**
 * دالة لجلب بيانات الشموع (OHLCV) من المنصة المحددة.
 * @param {string} exchangeId - معرف المنصة (مثل 'binance', 'kucoin').
 * @param {string} symbol - رمز العملة (مثل 'BTCUSDT', 'BTC-USDT').
 * @param {string} interval - الفاصل الزمني للشموع (مثل '1m', '5m', '1h').
 * @param {number} limit - عدد الشموع المراد جلبها (عادة 1 لآخر شمعة).
 * @returns {Promise<Array<Object>|null>} مصفوفة من كائنات الشموع أو null في حالة الخطأ.
 */
async function fetchCandlestickData(exchangeId, symbol, interval, limit = 1) {
    const exchange = EXCHANGES_CONFIG[exchangeId];
    if (!exchange || !exchange.candlestickUrl || !exchange.parseCandle || !exchange.intervalMap[interval]) {
        console.error(`منصة ${exchangeId} لا تدعم جلب الشموع بهذا الفاصل "${interval}" أو إعداداتها غير كاملة.`);
        return null;
    }

    let apiUrl = '';
    const now = new Date();
    const endTimeMs = now.getTime();
    const mappedInterval = exchange.intervalMap[interval];

    try {
        let response, data;

        switch (exchangeId) {
            case 'binance':
                apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&interval=${mappedInterval}&limit=${limit}`;
                break;
            case 'kucoin':
                const startTimeMsK = endTimeMs - (parseIntervalToMilliseconds(interval) * limit * 1.5); // زيادة صغيرة لضمان الحصول على شمعة
                apiUrl = `${exchange.candlestickUrl}?symbol=${symbol}&type=${mappedInterval}&startAt=${Math.floor(startTimeMsK / 1000)}&endAt=${Math.floor(endTimeMs / 1000)}`;
                break;
            case 'coincap':
                console.warn("CoinCap لا تدعم جلب الشموع (OHLC) بشكل مباشر في هذا التكوين.");
                return null;
            case 'coingecko':
                const coinGeckoCoinId = COINGECKO_ID_MAP[symbol];
                if (!coinGeckoCoinId) {
                    console.error(`معرف CoinGecko غير موجود لـ ${symbol}.`);
                    return null;
                }
                // CoinGecko OHLC API يستخدم 'days' كمعامل
                let days = mappedInterval; 
                apiUrl = `${exchange.candlestickUrl}${coinGeckoCoinId}/ohlc?vs_currency=${exchange.usdtSuffix}&days=${days}`;
                break;
            case 'okx':
                const startTimeMsO = endTimeMs - (parseIntervalToMilliseconds(interval) * limit);
                apiUrl = `${exchange.candlestickUrl}?instType=SPOT&instId=${symbol}&bar=${mappedInterval}&limit=${limit}&before=${endTimeMs}&after=${startTimeMsO}`;
                break;
            default:
                console.warn(`جلب الشموع غير مدعوم للمنصة: ${exchangeId}`);
                return null;
        }

        response = await axios.get(apiUrl);
        data = response.data;

        let candles = [];
        if (response.status !== 200) {
            console.error(`خطأ من ${exchange.name} API (${response.status}):`, data.msg || JSON.stringify(data));
            return null;
        }

        if (exchangeId === 'kucoin' || exchangeId === 'okx') {
            if (data.code === '200000' || data.code === '0') {
                candles = data.data.map(exchange.parseCandle);
            } else {
                console.error(`خطأ من ${exchange.name} API (شموع):`, data.msg || JSON.stringify(data));
                return null;
            }
        } else if (exchangeId === 'binance') {
            candles = data.map(exchange.parseCandle);
        } else if (exchangeId === 'coingecko') {
            if (Array.isArray(data) && data.length) {
                candles = data.map(exchange.parseCandle);
            } else {
                console.error(`خطأ من ${exchange.name} API (شموع):`, JSON.stringify(data));
                return null;
            }
        } else {
            console.warn(`معالجة بيانات الشموع غير معرفة للمنصة: ${exchangeId}`);
            return null;
        }
        
        // عادةً ما نرغب في أحدث شمعة (أو الشموع الأخيرة)
        return candles.slice(-limit); 

    } catch (error) {
        console.error(`خطأ في جلب بيانات الشموع لـ ${symbol} من ${exchange.name}:`, error.response ? error.response.data : error.message);
        return null;
    }
}

/**
 * دالة لجلب السعر الفوري لرمز عملة من منصة معينة.
 * قد لا تكون ضرورية لعملية فحص التنبيهات باستخدام الشموع، لكنها مفيدة للتحقق الفوري.
 * @param {string} exchangeId - معرف المنصة.
 * @param {string} symbol - رمز العملة.
 * @returns {Promise<number|null>} السعر الحالي أو null.
 */
async function fetchCurrentPrice(exchangeId, symbol) {
    const exchange = EXCHANGES_CONFIG[exchangeId];
    if (!exchange || !exchange.tickerPriceUrl) {
        console.error(`معلومات URL للسعر الفوري غير متوفرة للمنصة: ${exchangeId}.`);
        return null;
    }

    let apiUrl = '';
    let currentPrice = null;
    const coinGeckoCoinId = COINGECKO_ID_MAP[symbol];

    try {
        let response, data;

        switch (exchangeId) {
            case 'binance':
                apiUrl = `${exchange.tickerPriceUrl}?symbol=${symbol}`;
                response = await axios.get(apiUrl);
                data = response.data;
                if (response.status === 200 && data && data.price) {
                    currentPrice = parseFloat(data.price);
                }
                break;
            case 'kucoin':
                apiUrl = `${exchange.tickerPriceUrl}?symbol=${symbol}`;
                response = await axios.get(apiUrl);
                data = response.data;
                if (response.status === 200 && data.code === '200000' && data.data && data.data.price) {
                    currentPrice = parseFloat(data.data.price);
                }
                break;
            case 'coincap':
                apiUrl = `${exchange.tickerPriceUrl}/${symbol.replace(exchange.usdtSuffix, '').toLowerCase()}`;
                response = await axios.get(apiUrl);
                data = response.data;
                if (response.status === 200 && data.data && data.data.priceUsd) {
                    currentPrice = parseFloat(data.data.priceUsd);
                }
                break;
            case 'coingecko':
                if (!coinGeckoCoinId) {
                    console.error(`معرف CoinGecko غير موجود لـ ${symbol}.`);
                    return null;
                }
                apiUrl = `${exchange.tickerPriceUrl}?ids=${coinGeckoCoinId}&vs_currencies=${exchange.usdtSuffix}`;
                response = await axios.get(apiUrl);
                data = response.data;
                if (response.status === 200 && data[coinGeckoCoinId] && data[coinGeckoCoinId][exchange.usdtSuffix]) {
                    currentPrice = data[coinGeckoCoinId][exchange.usdtSuffix];
                }
                break;
            case 'okx':
                apiUrl = `${exchange.tickerPriceUrl}?instType=SPOT&instId=${symbol}`;
                response = await axios.get(apiUrl);
                data = response.data;
                if (response.status === 200 && data.code === '0' && data.data && data.data.length > 0) {
                    currentPrice = parseFloat(data.data[0].last);
                }
                break;
            default:
                console.warn(`جلب السعر الفوري غير مدعوم للمنصة: ${exchangeId}`);
                return null;
        }
        
        if (currentPrice === null) {
            console.warn(`فشل في جلب السعر لـ ${symbol} من ${exchange.name}.`);
        }
        return currentPrice;

    } catch (error) {
        console.error(`خطأ في جلب السعر الفوري لـ ${symbol} من ${exchange.name}:`, error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = {
    fetchCandlestickData,
    fetchCurrentPrice
};