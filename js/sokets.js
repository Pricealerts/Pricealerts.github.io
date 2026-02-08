/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
//// binance WebSocket
let oldTmBnc=Date.now();
function bncWebSocket(symbol) {
        console.log('3awdo');
		clearInterval(priceUpdateInterval);
        priceUpdateInterval=null
	if (priceUpdateInterval) {
		clearInterval(priceUpdateInterval);
	}
	if (binanceSocket && binanceSocketSmbl != symbol) {
		binanceSocket.close();
		binanceSocket = null;
	}
	const symbolL = symbol.toLowerCase();
	binanceSocket = new WebSocket(
		`wss://stream.binance.com:9443/ws/${symbolL}@ticker`,
	);
	binanceSocketSmbl = symbol;
	binanceSocket.onmessage = event => {
		const data = JSON.parse(event.data);
		currentPrice = parseFloat(data.c); // 'c' تعني السعر الحالي (Current/Last price)
		currentPriceDisplay.textContent = `${currentPrice} `;
        const nowDate = Date.now();
        const dfrnc = nowDate- oldTmBnc;
        if (dfrnc > 3000) {
		hndlAlrt(currentPrice, symbol);
        oldTmBnc = nowDate;
        }
	};
	return allPricesBnc.find(obj => obj.symbol == symbol).price;
}

/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
//// mexc WebSocket



let gateSocket;

function startGateTracking(symbols = ["BTC_USDT", "ETH_USDT"]) {
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
	/* gateSocket.onclose = () => {
		console.log("⚠️ انقطع اتصال Gate.io، سيعاد الاتصال بعد 5 ثوانٍ...");
		setTimeout(() => startGateTracking(symbols), 5000);
	}; */
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
	//console.log(clrPrBnc);
	// ["ETH", "BNB", "ADA", "SOL", "XRP"]
}

//finnhubFnctn();

const apiKey = "d4irn9pr01queuak9lh0d4irn9pr01queuak9lhg"; // ضع مفتاحك الخاص هنا

///////////////////////////////////////////
///////////////////////////////////////////
///////////////////////////////////////////
///////////////////////////////////////////
///////////////////////////////////////////
////// hada mrigl
//connectKuCoinWS()
async function connectKuCoinWS() {
	try {
		// الخطوة 1: الحصول على الـ Token وعناوين السيرفرات
		const data = await ftchFnctnAPPs({ action: "kuCoinWS" });

		const { token, instanceServers } = data;
		console.log(token, instanceServers);
		const endpoint = instanceServers[0].endpoint;
		const connectId = Date.now(); // معرف فريد للاتصال

		// الخطوة 2: إنشاء اتصال الـ WebSocket
		const socket = new WebSocket(
			`${endpoint}?token=${token}&connectId=${connectId}`,
		);

		// عند فتح الاتصال
		socket.onopen = () => {
			console.log("✅ متصل بـ KuCoin WebSocket");

			// الخطوة 3: الاشتراك في قناة معينة (مثلاً: سعر BTC-USDT اللحظي)
			const subscribeMsg = {
				id: Date.now(),
				type: "subscribe",
				topic: "/market/ticker:0G-USDT", // يمكنك تغيير العملة هنا
				privateChannel: false,
				response: true,
			};
			socket.send(JSON.stringify(subscribeMsg));
		};

		// استقبال البيانات
		socket.onmessage = event => {
			const msg = JSON.parse(event.data);
			if (msg.type === "message") {
				console.log("📊 بيانات السعر الحالية:", msg.data);
			} else {
				console.log("📩 رسالة من السيرفر:", msg);
			}
		};

		// التعامل مع الأخطاء
		socket.onerror = error => {
			console.error("❌ خطأ في الاتصال:", error);
		};

		// عند إغلاق الاتصال
		socket.onclose = () => {
			console.log("🔌 تم قطع الاتصال");
		};

		// حافظ على الاتصال حياً (Ping) كل 20 ثانية
		setInterval(() => {
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify({ id: Date.now(), type: "ping" }));
			}
		}, 20000);
	} catch (error) {
		console.error("⚠️ فشل في جلب الـ Token:", error);
	}
}

//connectKuCoinWS();

function connectOKX(smbl) {
	// عنوان WebSocket الخاص بـ OKX للبيانات العامة
	const okxWsUrl = "wss://ws.okx.com:8443/ws/v5/public";
	const socket = new WebSocket(okxWsUrl);

	socket.onopen = () => {
		console.log("✅ متصل بـ OKX WebSocket");

		// الاشتراك في سعر العملة (مثلاً BTC-USDT)
		const subscribeMsg = {
			op: "subscribe",
			args: [
				{
					channel: "tickers",
					instId: smbl, //"BTC-USDT"
				},
			],
		};
		socket.send(JSON.stringify(subscribeMsg));
	};

	socket.onmessage = event => {
		const data = JSON.parse(event.data);

		// التأكد من أن الرسالة تحتوي على بيانات الأسعار
		if (data.data) {
			const price = data.data[0].last;
			console.log(`💰 سعر BTC الآن: ${price}`);
		} else {
			console.log("📩 رسالة من السيرفر:", data);
		}
	};

	socket.onerror = error => {
		console.error("❌ خطأ:", error);
	};

	socket.onclose = () => {
		console.log("🔌 تم قطع الاتصال، جاري محاولة إعادة الاتصال...");
		setTimeout(connectOKX, 5000); // إعادة اتصال تلقائي
	};

	// إرسال "ping" كل 20 ثانية للحفاظ على الاتصال
	setInterval(() => {
		if (socket.readyState === WebSocket.OPEN) {
			socket.send("ping");
		}
	}, 20000);
}

//connectOKX();

function connectCryptoCompare(smbl) {
	smbl = smbl.replace("-", "~");
	// استبدل 'YOUR_API_KEY' بمفتاحك الخاص
	const apiKey =
		"c60217b3b7ffab489c03f232284f717034db471ecdcbc25876c75bdef9756e0f";
	const ccWsUrl = `wss://streamer.cryptocompare.com/v2?api_key=${apiKey}`;
	const socket = new WebSocket(ccWsUrl);

	socket.onopen = () => {
		console.log("✅ متصل بـ CryptoCompare WebSocket");

		// الاشتراك في قناة "المؤشر المجمع" (Sub ID: 5)
		// الصيغة: {SubID}~{ExchangeName}~{FromSymbol}~{ToSymbol}
		const subscribeMsg = {
			action: "SubAdd",
			subs: ["5~CCCAGG~0G~USDC"], // سعر البيتكوين المجمع مقابل الدولار    BTC~USD
		};
		socket.send(JSON.stringify(subscribeMsg));
	};

	socket.onmessage = event => {
		const message = JSON.parse(event.data);

		// النوع "5" هو بيانات السعر المجمع
		if (message.TYPE === "5" && message.PRICE) {
			console.log(`🚀 السعر المجمع (BTC): $${message.PRICE}`);
		} else if (message.MESSAGE === "SUBSCRIBE_COMPLETE") {
			console.log("🔔 تم الاشتراك في القناة بنجاح");
		}
	};

	socket.onerror = error => console.error("❌ خطأ:", error);

	socket.onclose = () => {
		console.log("🔌 تم قطع الاتصال، إعادة المحاولة...");
		setTimeout(connectCryptoCompare, 5000);
	};
}

/* async function searchCoin() {
    const url = 'https://min-api.cryptocompare.com/data/all/coinlist';
    const response = await fetch(url);
    const data = await response.json();
    
    // البحث داخل البيانات
    const coins = data.Data;
	const smbls =Object.keys(coins)
	console.log(smbls);
	
    //  for (let symbol in coins) {
    //     if (coins[symbol].CoinName.toLowerCase() .includes(coinName.toLowerCase()) ) {
    //         console.log(`✅ العملة: ${coins[symbol].CoinName} | الرمز: ${symbol}`);
    //     }
    // } 
}

// مثال: ابحث عن رمز عملة "Solana"
searchCoin(); */
