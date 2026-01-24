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
	const clrPrBnc = allPricesBns.map(s => s.symbol).map(pair => pair.replace(/(_|USDT|USDC|BTC)/g, ""));
	const clrPrMexc = allPricesMexc.map(s => s.symbol).map(pair => pair.replace(/(_|USDT|USDC|BTC)/g, ""));
    const gateIoSmbls2 = JSON.parse(localStorage.getItem("gateIoSmbls"));
    const gateIoSmbls = gateIoSmbls2.symbols.map(s => s.replace(/(_|USDT|USDC|BTC)/g, ""));
    console.log(gateIoSmbls);
    
    const dfrnsMxcBnc = clrPrMexc.filter(item => !clrPrBnc.includes(item));
     const dfrnsMxcBncGat = dfrnsMxcBnc.filter(item => !gateIoSmbls.includes(item));
     const strslt = [...new Set(dfrnsMxcBncGat)];
    console.log(strslt);
	//console.log(clrPrBnc);
	// ["ETH", "BNB", "ADA", "SOL", "XRP"]
}
