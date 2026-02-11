/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
//// binance WebSocket
let exchSocket, socketSmbl, intervalWebSockt;

function hndlWebSocket(symbol) {
	if (priceUpdateInterval) {
		clearInterval(priceUpdateInterval);
	}
	if (exchSocket && socketSmbl != symbol) {
		exchSocket.close();
		exchSocket = null;
	}
	socketSmbl = symbol;
}
function errCnsl(ping) {
	// التعامل مع الأخطاء
	exchSocket.onerror = error => {
		console.error("❌ خطأ في الاتصال:", error);
	};
	// عند إغلاق الاتصال
	exchSocket.onclose = () => {
		console.log("🔌 تم قطع الاتصال");
	};
	if (intervalWebSockt) {
		clearInterval(intervalWebSockt);
	}
	// حافظ على الاتصال حياً (Ping) كل 20 ثانية
	intervalWebSockt = setInterval(() => {
		if (exchSocket.readyState === WebSocket.OPEN) {
			exchSocket.send(ping);
		}
	}, 20000);
}
function bncWebSocket(symbol) {
	const symbolL = symbol.toLowerCase();
	hndlWebSocket(symbolL);
	exchSocket = new WebSocket(
		`wss://stream.binance.com:9443/ws/${symbolL}@ticker`,
	);
	exchSocket.onmessage = event => {
		const data = JSON.parse(event.data);
		currentPrice = parseFloat(data.c); // 'c' تعني السعر الحالي (Current/Last price)
		currentPriceDisplay.textContent = `${currentPrice} `;
	};
	return allPricesBnc.find(obj => obj.symbol == symbol).price;
}

let bncSckt,
	scktSmblBnc = [];
function bncWebSocketMult() {
	const symbolsOrder = Array.from(symbolsMap);
	const symbols = symbolsOrder
		.map(([s, e]) => (e === "binance" ? s.tlc() + "@ticker" : false))
		.filter(Boolean);
	const eq =
		symbols.length === scktSmblBnc.length &&
		symbols.every((val, i) => val === scktSmblBnc[i]);
	if (!symbols.length || (bncSckt && eq)) return;
	else if (bncSckt) bncSckt.close();
	scktSmblBnc = symbols;
	bncSckt = new WebSocket("wss://stream.binance.com:9443/ws");
	bncSckt.onopen = () => {
		const msg = {
			method: "SUBSCRIBE",
			params: symbols,
			id: 1,
		};
		bncSckt.send(JSON.stringify(msg));
	};
	let oldTmBnc = Date.now();
	bncSckt.onmessage = event => {
		const data = JSON.parse(event.data);
		if (data.e === "24hrTicker") {
			const nowDate = Date.now();
			const dfrnc = nowDate - oldTmBnc;
			if (dfrnc > 3000) {
				hndlAlrt(data.c, data.s);
				oldTmBnc = nowDate;
			}
		}
	};
}

///////////////////////////////////////////
///////////////////////////////////////////
///////////////////////////////////////////
////// hada mrigl kuCoin
async function connectKuCoinWS(symbol = "0G-USDT") {
	hndlWebSocket(symbol);
	try {
		// الخطوة 1: الحصول على الـ Token وعناوين السيرفرات
		const data = await ftchFnctnAPPs({ action: "kuCoinWS" });
		const { token, instanceServers } = data;
		const endpoint = instanceServers[0].endpoint;
		let connectId = Date.now(); // معرف فريد للاتصال
		// الخطوة 2: إنشاء اتصال الـ WebSocket
		exchSocket = new WebSocket(
			`${endpoint}?token=${token}&connectId=${connectId}`,
		);
		// عند فتح الاتصال
		exchSocket.onopen = () => {
			const subscribeMsg = {
				id: Date.now(),
				type: "subscribe",
				topic: "/market/ticker:" + symbol, // يمكنك تغيير العملة هنا
				privateChannel: false,
				response: true,
			};
			exchSocket.send(JSON.stringify(subscribeMsg));
		};
		// استقبال البيانات
		exchSocket.onmessage = event => {
			const msg = JSON.parse(event.data);
			if (msg.type === "message") {
				currentPriceDisplay.textContent = `${msg.data.size} `;
				const nowDate = Date.now();
				const dfrnc = nowDate - connectId;
				if (dfrnc > 3000) {
					hndlAlrt(msg.data.size, symbol);
					connectId = nowDate;
				}
			}
		};
		errCnsl(JSON.stringify({ id: Date.now(), type: "ping" }));
	} catch (error) {
		console.error("⚠️ فشل في جلب الـ Token:", error);
	}
}

/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
//// OKX

function connectOKX(symbol) {
	hndlWebSocket(symbol);
	let connectId = Date.now();
	// عنوان WebSocket الخاص بـ OKX للبيانات العامة
	const okxWsUrl = "wss://ws.okx.com:8443/ws/v5/public";
	exchSocket = new WebSocket(okxWsUrl);
	exchSocket.onopen = () => {
		const subscribeMsg = {
			op: "subscribe",
			args: [
				{
					channel: "tickers",
					instId: symbol, //"BTC-USDT"
				},
			],
		};
		exchSocket.send(JSON.stringify(subscribeMsg));
	};
	exchSocket.onmessage = event => {
		const data = JSON.parse(event.data);
		if (data.data) {
			const price = data.data[0].last;
			currentPriceDisplay.textContent = `${price} `;
			const nowDate = Date.now();
			const dfrnc = nowDate - connectId;
			if (dfrnc > 3000) {
				hndlAlrt(price, symbol);
				connectId = nowDate;
			}
		}
	};
	// الحفاظ على الاتصال حياً (Ping) كل 20 ثانية
	errCnsl("ping");
}

/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
//// bybit

// عنوان الـ WebSocket الخاص بـ Bybit (للعقود الآجلة Linear - USDT)

function connectBybit(symbol = "BTCUSDT") {
	hndlWebSocket(symbol);
	let connectId = Date.now();
	const bybitWsUrl = "wss://stream.bybit.com/v5/public/linear";
	exchSocket = new WebSocket(bybitWsUrl);
	exchSocket.onopen = () => {
		console.log("✅ متصل بـ Bybit WebSocket");
		const subscribeMsg = {
			op: "subscribe",
			args: ["tickers." + symbol],
		};
		exchSocket.send(JSON.stringify(subscribeMsg));
	};
	exchSocket.onmessage = event => {
		const response = JSON.parse(event.data);
		// معالجة بيانات السعر عند وصول تحديث
		if (response.topic === "tickers." + symbol && response.data) {
			const price = response.data.lastPrice;
			if (price) {
				currentPriceDisplay.textContent = `${price} `;
				const nowDate = Date.now();
				const dfrnc = nowDate - connectId;
				if (dfrnc > 3000) {
					hndlAlrt(price, symbol);
					connectId = nowDate;
				}
			}
		}
	};
	// الحفاظ على الاتصال حياً (Ping) كل 20 ثانية
	errCnsl(JSON.stringify({ op: "ping" }));
}

/*//connectBybit();

/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
//// startGateTracking

function startGateTracking(symbols = ["BTC_USDT", "ETH_USDT"]) {
	let gateSocket;
	//const apiKey = "d4irn9pr01queuak9lh0d4irn9pr01queuak9lhg"; // ضع مفتاحك الخاص هنا
	if (gateSocket) gateSocket.close();
	gateSocket = new WebSocket("wss://api.gateio.ws/ws/v4/");
	gateSocket.onopen = () => {
		const subscribeMsg = {
			time: Math.floor(Date.now() / 1000),
			channel: "spot.tickers",
			event: "subscribe",
			payload: symbols.map(s => s.toUpperCase()),
		};
		gateSocket.send(JSON.stringify(subscribeMsg));
		setInterval(() => {
			if (gateSocket.readyState === WebSocket.OPEN) {
				gateSocket.send(JSON.stringify({ method: "ping" }));
			}
		}, 20000);
	};
	gateSocket.onmessage = event => {
		const msg = JSON.parse(event.data);
		// معالجة البيانات القادمة
		if (msg.event === "update" && msg.channel === "spot.tickers") {
			const data = msg.result;
			const symbol = data.currency_pair; // اسم العملة
			const price = parseFloat(data.last); // آخر سعر
			console.log(`🚀 Gate.io [${symbol}]: ${price}`);
		}
	};
	 gateSocket.onclose = () => {
		console.log("⚠️ انقطع اتصال Gate.io، سيعاد الاتصال بعد 5 ثوانٍ...");
		setTimeout(() => startGateTracking(symbols), 5000);
	}; 
	gateSocket.onerror = err => {
		console.error("❌ خطأ في اتصال Gate:", err);
	};
} 

/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
//// nta3 filtre

 function gtDifrns() {
	const clrPrBnc = allPricesBnc
		.map(s => s.symbol)
		.map(pair => pair.replace(/(_|USDT|USDC|BTC)/g, ""));
	const clrPrMexc = allPricesMexc
		.map(s => s.symbol)
		.map(pair => pair.replace(/(_|USDT|USDC|BTC)/g, ""));
	const gateIoSmbls2 = JSON.parse(localStorage.getItem("gateIoSmbls"));
	const gateIoSmbls = gateIoSmbls2.symbols.map(s =>
		s.replace(/(_|USDT|USDC|BTC)/g, ""),
	);
	console.log(gateIoSmbls);

	const dfrnsMxcBnc = clrPrMexc.filter(item => !clrPrBnc.includes(item));
	const dfrnsMxcBncGat = dfrnsMxcBnc.filter(
		item => !gateIoSmbls.includes(item),
	);
	const strslt = [...new Set(dfrnsMxcBncGat)];
	console.log(strslt);
}
async function cryptocompare(coin = "BTC", currency = "USDT") {
	const apiKey =
		"c60217b3b7ffab489c03f232284f717034db471ecdcbc25876c75bdef9756e0f"; // ضع مفتاحك هنا
	const url = `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=${currency}&api_key=${apiKey}`;

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error("فشل في جلب البيانات");
		const data = await response.json();
		// الوصول للسعر بناءً على العملة المطلوبة
		const price = data[currency];
		console.log(`💰 سعر ${coin} الحالي هو: ${price} ${currency}`);
		return price;
	} catch (error) {
		console.error("❌ خطأ:", error);
	}
}

async function searchCoin() {
	const url = "https://min-api.cryptocompare.com/data/all/coinlist";
	const response = await fetch(url);
	const data = await response.json();

	// البحث داخل البيانات
	const coins = data.Data;
	const smbls = Object.keys(coins);
	console.log(smbls);

	//  for (let symbol in coins) {
	//     if (coins[symbol].CoinName.toLowerCase() .includes(coinName.toLowerCase()) ) {
	//         console.log(`✅ العملة: ${coins[symbol].CoinName} | الرمز: ${symbol}`);
	//     }
	// }
} */
