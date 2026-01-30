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
	gateSocket.onclose = () => {
		console.log("⚠️ انقطع اتصال Gate.io، سيعاد الاتصال بعد 5 ثوانٍ...");
		setTimeout(() => startGateTracking(symbols), 5000);
	};
	gateSocket.onerror = err => {
		console.error("❌ خطأ في اتصال Gate:", err);
	};
}

// لتجربة الكود:
//startGateTracking(['BTC_USDT', 'ETH_USDT']);

async function getAllGatePrices() {
	try {
		const response = await fetch("https://api.gateio.ws/api/v4/spot/tickers");
		const data = await response.json();

		// البيانات تعود كمصفوفة من الكائنات
		/* data.forEach(item => {
             console.log(`العملة: ${item.currency_pair}, السعر: ${item.last}`);
        }); */
		console.log(data);

		// return data;
	} catch (error) {
		console.error("فشل جلب البيانات:", error);
	}
}
/* 
fetch('https://api.gateio.ws/api/v4/spot/tickers', {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error('Error:', err));
 */

function gtDifrns() {
	const clrPrBnc = allPricesBns
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
const exchange = "NASDAQ"; // 'US'; // يمكنك تغييرها لـ 'AS' للبورصات الآسيوية مثلاً

async function getAllSymbols() {
	const url = `https://finnhub.io/api/v1/stock/symbol?exchange=${exchange}&token=${apiKey}`;

	try {
		const response = await fetch(url);
		const symbols = await response.json();

		console.log(`تم جلب ${symbols.length} شركة من بورصة ${exchange}`);

		// عرض أول 5 شركات كمثال
		console.log("أمثلة من الشركات:", symbols);

		// إذا أردت استخراج الرموز فقط في مصفوفة بسيطة:
		const onlySymbols = symbols.map(s => s.symbol);
		return onlySymbols;
	} catch (error) {
		console.error("خطأ في جلب البيانات:", error);
	}
}

async function getNasdaqSymbols() {
	const url = `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`;

	try {
		const response = await fetch(url);
		const allSymbols = await response.json();

		// تصفية النتائج لجلب شركات NASDAQ فقط
		const nasdaqOnly = allSymbols.filter(item => item.mic === "XNAS");

		console.log(`تم العثور على ${nasdaqOnly.length} شركة في NASDAQ`);
		console.table(nasdaqOnly); // عرض أول 10 شركات في جدول
	} catch (error) {
		console.error("خطأ:", error);
	}
}

//getNasdaqSymbols();
//getAllSymbols();

async function fetchAllExchanges() {
	// خريطة تحويل الأسماء التي طلبتها إلى الأكواد المدعومة في Finnhub
	const exchangeMapping = [
		{ name: "USA (NASDAQ/NYSE)", code: "US" },
		{ name: "London (LSE)", code: "L" },
		{ name: "Singapore (XSES)", code: "SI" },
		{ name: "Hong Kong (HKEX)", code: "HK" },
		{ name: "India (NSE)", code: "NS" },
		{ name: "Switzerland (SIX/XSWX)", code: "SW" },
		{ name: "Paris (XPAR)", code: "PA" },
		{ name: "Shanghai (XSHG)", code: "SS" },
		{ name: "Shenzhen (XSHE)", code: "SZ" },
	];
	for (const exchange of exchangeMapping) {
		const url = `https://finnhub.io/api/v1/stock/symbol?exchange=${exchange.code}&token=${apiKey}`;

		try {
			const response = await fetch(url);
			const data = await response.json();

			console.log(`--- البورصة: ${exchange.name} ---`);
			console.log(`عدد الرموز المتاحة: ${data.length}`);

			// طباعة أول 3 رموز كمثال لكل بورصة
			console.log(
				"أمثلة:",
				data.slice(0, 3).map(s => s.symbol),
			);

			// تأخير بسيط لتجنب حظر الطلبات المتتالية (Rate Limiting)
			await new Promise(resolve => setTimeout(resolve, 500));
		} catch (error) {
			console.error(`خطأ في جلب بيانات ${exchange.name}:`, error);
		}
	}
}

//fetchAllExchanges();

function finnhubWebSckt() {
	const socket = new WebSocket("wss://ws.finnhub.io?token=d4irn9pr01queuak9lh0d4irn9pr01queuak9lhg");

	// 1. عند فتح الاتصال، اشترك في الأسهم التي تريدها
	socket.addEventListener("open", function () {
		socket.send(JSON.stringify({ type: "subscribe", symbol: "AAPL" }));
		socket.send(
			JSON.stringify({ type: "subscribe", symbol: "BINANCE:BTCUSDT" }),
		);
	});

	// 2. الاستماع للأسعار اللحظية
	socket.addEventListener("message", function (event) {
		const data = JSON.parse(event.data);

		if (data.type === "trade") {
			data.data.forEach(trade => {
				console.log(
					`السهم: ${trade.s} | السعر: ${trade.p} | الوقت: ${new Date(trade.t)}`,
				);
			});
		}
	});

	// 3. التعامل مع الأخطاء
	socket.addEventListener("error", function (event) {
		console.error("خطأ في الاتصال:", event);
	});
}



