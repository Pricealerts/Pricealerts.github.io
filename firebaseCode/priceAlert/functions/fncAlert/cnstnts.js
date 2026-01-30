// ✅ 1. جعل الإعدادات ثابتاً عالمياً (Global Constant) لمرة واحدة فقط
// هذا يحمي الذاكرة من التضخم ويقلل وقت التنفيذ
export const EXCHANGES_CONFIG = {
	binance: {
		name: "Binance",
		tickerPriceUrl: "https://api.binance.com/api/v3/ticker/price",
		candlestickUrl: "https://api.binance.com/api/v3/klines", // نقطة نهاية الشموع
		usdtSuffix: "USDT",
		parseCandle: c => ({
			//time: parseInt(c[0]),
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
			//time: parseInt(c[0]),
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
			//time: parseInt(c[0]) * 1000,
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
			//time: parseInt(c.open_time) * 1000,
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
		candlestickUrl: "https://api.coingecko.com/api/v3/coins/",
		usdtSuffix: "USD",
		parseCandle: c => ({
			//time: c[0],
			open: c[1],
			high: c[2],
			low: c[3],
			close: c[4],
		}),
		intervalMap: { "1m": "1", "5m": "5", "15m": "15", "1h": "60" },
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
	nasdaqe: {
		name: "NASDAQ",
		candlestickUrl: "https://query1.finance.yahoo.com/v8/finance/chart/",
		usdtSuffix: "-USD",
		parseCandle: data => {
			const result = data.chart.result[0];
			const timestamps = result.timestamp;
			const indicators = result.indicators.quote[0];
			return timestamps.map((e, i) => ({
				open: indicators.open[i],
				high: indicators.high[i],
				low: indicators.low[i],
				close: indicators.close[i],
				volume: indicators.volume[i],
			}));
		},
		intervalMap: {
			"1m": "1m",
			"2m": "2m",
			"5m": "5m",
			"15m": "15m",
			"1h": "1h",
			"1d": "1d",
		},
	},
};

export const exchs = [
	"nyse",
	"xetra",
	"lse",
	"TSE",
	"HKSE",
	"NSE",
	"other",
	"nasdaq",
];
exchs.forEach(ex => {
	EXCHANGES_CONFIG[ex] = { ...EXCHANGES_CONFIG.nasdaqe };
	EXCHANGES_CONFIG[ex].name = ex; //.toLowerCase()
});
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
			const startDate =
				new Date(ndt.getTime() - 60 * 120 * 1000).toISOString().split(".")[0] +
				"Z";
			const endDate = new Date().toISOString().split(".")[0] + "Z";
			apiUrl = `${exchange.tickerPriceUrl}${symbol}/candles?start=${startDate}&end=${endDate}&granularity=300`;
			break;
		case "nasdaq":
		case "nyse":
		case "xetra":
		case "lse":
		case "TSE":
		case "HKSE":
		case "NSE":
		case "other":
			apiUrl = `${exchange.candlestickUrl}${symbol}?interval=${mappedInterval}&range=${limit}d`;
			break;
		default:
			`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`;
	}

	return apiUrl;
};
export const gtCndlYahoo = response => {
	const result = response.data?.chart?.result?.[0];
	if (!result) {
		return { error: "No data found" };
	}
	const timestamps = result.timestamp;
	const q = result.indicators?.quote?.[0];
	const meta = result.meta;

	const regularPeriod = meta.currentTradingPeriod?.regular;
	const mt = {
		st: regularPeriod.start,
		end: regularPeriod.end,
		gm: meta.gmtoffset, //gmtoffset
	};
	// دالة مساعدة لتوليد الاستجابة التقديرية مع إضافة حالة السوق
	const createMetaResponse = m => [
		{
			//open: m.regularMarketPrice,
			high: m.regularMarketPrice,
			low: m.regularMarketPrice,
			// close: m.regularMarketPrice,
			meta: mt,
			currency: m.currency,
			marketState: m.marketState, // يخبرك إذا كان السوق مغلقاً (CLOSED) أو مفتوحاً (REGULAR)
			isEstimated: true,
		},
	];
	// 1. حالة عدم وجود مصفوفات بيانات (بيانات الرسوم البيانية مفقودة تماماً)
	if (!timestamps || !q) {
		if (meta?.regularMarketPrice) return createMetaResponse(meta);
		return { error: "No chart or meta data available" };
	}

	let i = timestamps.length - 1;
	// 2. البحث عن آخر شمعة مكتملة البيانات
	while (
		i >= 0 &&
		(q.high[i] === null || q.low[i] === null) /* || q.close[i] === null */
	) {
		i--;
	}
	// 3. إذا كانت كل الشموع في المصفوفة فارغة، نلجأ للـ meta
	if (i < 0) {
		if (meta?.regularMarketPrice) return createMetaResponse(meta);

		return { error: "All candles are null and no market price found" };
	}

	// 4. إرجاع الشمعة الحقيقية مع معلومات السوق
	return [
		{
			//timestamp: timestamps[i],
			//open: q.open[i] || q.close[i],
			high: q.high[i],
			low: q.low[i],
			// close: q.close[i],
			meta: mt,
			currency: meta.currency,
			marketState: meta.marketState, // إضافة حالة السوق هنا أيضاً
		},
	];
};
