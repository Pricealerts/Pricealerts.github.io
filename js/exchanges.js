const EXCHANGES = {
	binance: {
		name: "Binance",
		exchangeInfoUrl: "https://api.binance.com/api/v3/exchangeInfo",
		tickerPriceUrl: "https://api.binance.com/api/v3/ticker/price",
		usdtSuffix: "USDT",
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	mexc: {
		name: "MEXC",
		exchangeInfoUrl: "https://api.mexc.com/api/v3/ticker/price",
		tickerPriceUrl: "https://api.mexc.com/api/v3/ticker/price",
		usdtSuffix: "USDT",
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	kucoin: {
		name: "KuCoin",
		exchangeInfoUrl: "https://api.kucoin.com/api/v1/symbols",
		tickerPriceUrl: "https://api.kucoin.com/api/v1/market/orderbook/level1",
		usdtSuffix: "USDT",
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	coingecko: {
		name: "CoinGecko",
		exchangeInfoUrl: "https://api.coingecko.com/api/v3/coins/list",
		tickerPriceUrl: "https://api.coingecko.com/api/v3/simple/price",
		usdtSuffix: "USD",
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	okx: {
		name: "OKX",
		exchangeInfoUrl:
			"https://www.okx.com/api/v5/public/instruments?instType=SPOT",
		tickerPriceUrl: "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
		usdtSuffix: "-USDT",
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	bybit: {
		name: "Bybit",
		exchangeInfoUrl: "https://api.bybit.com/v5/market/tickers?category=spot",
		tickerPriceUrl: "https://api.bybit.com/v2/public/tickers",
		usdtSuffix: "USDT",
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	bitget: {
		name: "Bitget",
		exchangeInfoUrl: "https://api.bitget.com/api/spot/v1/public/products",
		tickerPriceUrl: "https://api.bitget.com/api/spot/v1/market/tickers",
		usdtSuffix: "USDT_SPBL",
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	lbank: {
		name: "LBank",
		exchangeInfoUrl: "https://api.lbkex.com/v2/ticker.do?symbol=all", // ترجع جميع الرموز والأسعار
		tickerPriceUrl: "https://api.lbkex.com/v2/ticker.do?symbol=", // يتبعها رمز العملة
		usdtSuffix: "usdt", // الأحرف كلها صغيرة
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	coincap: {
		name: "CoinCap",
		exchangeInfoUrl:
			"https://cors-anywhere.herokuapp.com/https://api.coincap.io/v2/assets",
		tickerPriceUrl: "https://api.coincap.io/v2/assets?symbol=bitcoin", // يحتاج فلترة حسب الرمز
		usdtSuffix: "USDT",
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	kraken: {
		name: "Kraken",
		exchangeInfoUrl: "https://api.kraken.com/0/public/AssetPairs",
		tickerPriceUrl: "https://api.kraken.com/0/public/Ticker",
		usdtSuffix: "USDT", // في Kraken يتم تسعير USDT مقابل الدولار فعليًا
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	coinbase: {
		name: "Coinbase",
		exchangeInfoUrl: "https://api.exchange.coinbase.com/products",
		tickerPriceUrl: "https://api.exchange.coinbase.com/products", // + /<symbol>/ticker
		usdtSuffix: "-USDT",
		intervalData: 5000,
		crptChos: "block",
		usdDsply: "none",
	},
	nasdaq: {
		name: "NASDAQ",
		exchangeInfoUrl: "https://proxyrequestv2-nkipfwe2qq-ew.a.run.app",
		tickerPriceUrl: "https://proxyrequestv2-nkipfwe2qq-ew.a.run.app",
		usdtSuffix: "USD",
		intervalData: 3600000,
		crptChos: "none",
		usdDsply: "inline-block",
	},
};
const exchs = [
	"HKEX", //
	"LSE",
	"NSE",
	"SIX", //
	"XSWX", //
	"XPAR", //
	"XSHG", //
	"XSHE", //
	"XSES",
	"nyse",
	"nasdaq",
	"other"
];
exchs.forEach(ex => {
	EXCHANGES[ex] = { ...EXCHANGES.nasdaq };
	EXCHANGES[ex].name = ex; //.toLowerCase()
});
//console.log(EXCHANGES);

/* 
	function clone(obj) {
		return { ...obj };
	}

	EXCHANGES.nyse  = clone(EXCHANGES.nasdaq); 
*/

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

const otherPrpos = [
	"BMW.DE",
	"XAUT-USD",
	"XAGX-USD",
	"CL=F",
	"SI=F",
	"HG=F",
	"PL=F",
	"PA=F",
];

async function ftchFnctn(url, body) {
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		return await response.json();
	} catch (error) {
		console.error("Fetch error:", error);
		throw error;
	}
}
