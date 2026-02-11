let orgnUrls = [
	"https://script.google.com/macros/s/AKfycbzMgCAunXYJFMRFMQJX1UrQUnJdsjoHh31bZqumyi2-f6mgrJfbBwCwTNBR0YQUQD9ZSQ/exec",
	// "https://script.google.com/macros/s/AKfycbz_bPV0YD_u56AHej1sQstTnzk4LFAPrgDkRZYw-NzI0KzUCmPmL2uUn6P-TAC1jIel7Q/exec",
	// "https://script.google.com/macros/s/AKfycbxSDIjmCkCwVU3gyFfPABhHV5EayTrMmoFa4BAWhaRZwUsTB0c4LjD-i5D5JdN9oeyv/exec",
	// "https://script.google.com/macros/s/AKfycbwOXLglGbwUkBEfO1NFxhPcWwp5SeKv01XWZto5memVSoUnVMhlseZurVHOVP2V1ZIb/exec",
	// "https://script.google.com/macros/s/AKfycbxjD-PZ6LrbRhVXxiLf9M2BCS0Zf18UT1GjZKgCN-oTdqg0bd_x8BSZ9VmqZaxHKh3E/exec",
];
let frbsUrls = [
	"https://rqststocks-wgqzo7cltq-ew.a.run.app", // chatId
	//"https://rqststocks-yg7soqqfkq-ew.a.run.app", // gtPriceSearch
];
//frbsUrls =gtRndmUrl(frbsUrls)
let frbUrl = frbsUrls[0];

orgnUrls = gtRndmUrl(orgnUrls);
let apScUrl = orgnUrls[0];
console.log(frbUrl);

function gtRndmUrl(urls) {
	let rndmUrls = [];
	for (let i = urls.length; i > 0; i--) {
		const rndm = Math.floor(Math.random() * urls.length);
		rndmUrls.push(urls[rndm]);
		urls.splice(rndm, 1);
	}
	return rndmUrls;
}
const apiKyCrptcmpr =
	"c60217b3b7ffab489c03f232284f717034db471ecdcbc25876c75bdef9756e0f";
const EXCHANGES = {
	binance: {
		name: "Binance",
		exchangeInfoUrl: "https://api.binance.com/api/v3/exchangeInfo",
		tickerPriceUrl: "https://api.binance.com/api/v3/ticker/price",
		intervalData: 10000000,
	},
	mexc: {
		name: "MEXC",
		exchangeInfoUrl: "https://api.mexc.com/api/v3/ticker/price",
		tickerPriceUrl: "https://api.mexc.com/api/v3/ticker/price",
		intervalData: 10000,
	},
	kucoin: {
		name: "KuCoin",
		exchangeInfoUrl: "https://api.kucoin.com/api/v1/symbols",
		tickerPriceUrl: "https://api.kucoin.com/api/v1/market/orderbook/level1",
		intervalData: 10000,
	},
	coingecko: {
		name: "CoinGecko",
		exchangeInfoUrl: "https://api.coingecko.com/api/v3/coins/list",
		tickerPriceUrl: "https://api.coingecko.com/api/v3/simple/price",
		intervalData: 10000,
	},
	okx: {
		name: "OKX",
		exchangeInfoUrl:
			"https://www.okx.com/api/v5/public/instruments?instType=SPOT",
		tickerPriceUrl: "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
		intervalData: 10000,
	},
	bybit: {
		name: "Bybit",
		exchangeInfoUrl: "https://api.bybit.com/v5/market/tickers?category=spot",
		tickerPriceUrl: "https://api.bybit.com/v2/public/tickers",
		intervalData: 10000,
	},
	bitget: {
		name: "Bitget",
		exchangeInfoUrl: "https://api.bitget.com/api/spot/v1/public/products",
		tickerPriceUrl: "https://api.bitget.com/api/spot/v1/market/tickers",
		intervalData: 10000,
	},
	lbank: {
		name: "LBank",
		exchangeInfoUrl: "https://api.lbkex.com/v2/ticker.do?symbol=all", // ترجع جميع الرموز والأسعار
		tickerPriceUrl: "https://api.lbkex.com/v2/ticker.do?symbol=", // يتبعها رمز العملة
		intervalData: 10000,
	},
	coincap: {
		name: "CoinCap",
		exchangeInfoUrl:
			"https://cors-anywhere.herokuapp.com/https://api.coincap.io/v2/assets",
		tickerPriceUrl: "https://api.coincap.io/v2/assets?symbol=bitcoin", // يحتاج فلترة حسب الرمز
		intervalData: 10000,
	},
	kraken: {
		name: "Kraken",
		exchangeInfoUrl: "https://api.kraken.com/0/public/AssetPairs",
		tickerPriceUrl: "https://api.kraken.com/0/public/Ticker",
		intervalData: 10000,
	},
	coinbase: {
		name: "Coinbase",
		exchangeInfoUrl: "https://api.exchange.coinbase.com/products",
		tickerPriceUrl: "https://api.exchange.coinbase.com/products", // + /<symbol>/ticker
		intervalData: 10000,
	},
	cryptocompare: {
		name: "Cryptocompare",
		exchangeInfoUrl: "https://min-api.cryptocompare.com/data/all/coinlist",
		tickerPriceUrl: `https://min-api.cryptocompare.com/data/price?fsym=`, // ${coin}&tsyms=${currency}&api_key=${apiKey}
		intervalData: 10000,
		gturl: smbl =>
			`https://min-api.cryptocompare.com/data/price?fsym=${smbl}&tsyms=USDT&api_key=c60217b3b7ffab489c03f232284f717034db471ecdcbc25876c75bdef9756e0f`,
	},
	nasdaq: {
		name: "NASDAQ",
		exchangeInfoUrl: apScUrl,
		tickerPriceUrl: apScUrl,
		intervalData: 3600000,
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
	"gateIoSmbls",
	"other",
];
exchs.forEach(ex => {
	EXCHANGES[ex] = { ...EXCHANGES.nasdaq };
	EXCHANGES[ex].name = ex; //.toLowerCase()
});


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

async function ftchFnctn(body, url = null) {
	if (!url) {
		frbUrl = frbsUrls[frbsUrls.indexOf(frbUrl) + 1];
		if (!frbUrl) frbUrl = frbsUrls[0];
		url = frbUrl;
	}
	console.log(url);
	// بقية الكود
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

async function ftchFnctnAPPs(body) {
	apScUrl = orgnUrls[orgnUrls.indexOf(apScUrl) + 1];
	if (!apScUrl) apScUrl = orgnUrls[0];
	try {
		const response = await fetch(apScUrl, {
			method: "POST",
			"Content-Type": "application",
			body: JSON.stringify(body),
		});
		const rslt = await response.json();
		return rslt;
	} catch (error) {
		console.error("Fetch error:", error);
		throw error;
	}
}
