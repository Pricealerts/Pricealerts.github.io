// *** استبدل هذا برابط Web app URL الخاص بـ Google Apps Script الذي ستنشئه ***
let getPriceUrl =
	"https://script.google.com/macros/s/AKfycbyg0QZ6udY-A2E8r_Q5rwr46HKUgFxV2h1MvKW1xJtYBBx2OJAmQo5zBM_fYsGhjvU6/exec";
const FIREBASE_WEB_ALERT_URL =
	"https://europe-west1-pricealert-31787.cloudfunctions.net/proxyRequestV2";

let currencyFtch = "USD";
let rfrsh = 0;
async function smblsLclStrg(exchngId, nmDy, fnctn, bdy = exchngId) {
	let nmbrDays = 100;
	let localExSmbls = localStorage.getItem(exchngId);
	const today = Date.now();
	if (localExSmbls) {
		localExSmbls = JSON.parse(localExSmbls);
		const locaTim = localExSmbls.time;
		nmbrDays = (today - locaTim) / (1000 * 60 * 60 * 24);
	}
	if (nmbrDays < nmDy) {
		return localExSmbls.symbols;
	} else {
		const data = await fnctn(bdy);
		const tolclStrg = { symbols: data, time: today };
		localStorage[exchngId] = JSON.stringify(tolclStrg);
		return data; //symbols
	}
}
let allSmblBnc=[];
let allPricesBnc = [];
let allPricesMexc = [];
let allPricesKucoin = [];
let allPricesOkx = [];
let allPrices;
const MAX_ALERTS = 50; // يمكن تغيير هذا الحد الأقصى للتنبيهات
// تعريف جميع المنصات المدعومة وواجهات برمجة التطبيقات الخاصة بها
// --- وظائف جلب البيانات وتحديث الأسعار ---
async function fetchTradingPairs(exchangeId) {
	const exchange = EXCHANGES[exchangeId];
	if (!exchange) {
		currentPriceDisplay.textContent = "منصة غير متاحة.";
		searchPrice.placeholder = "الرجاء اختيار منصة صحيحة";
		return;
	}
	let dspl = "none";
	let crptChos = "none";
	let crptCmprLt = "none";
	if (exchangeId == "cryptocompare") {
		crptCmprLt = "inline-block";
		if (!allCrptCmpr.length) {
			allCrptCmpr.push({ symbol: "USDT", factor: 1 });
			allPricesBnc.forEach(el => {
				if (el.symbol.includes("USDT")) {
					const symbol = el.symbol.replace("USDT", "");
					const factor = 1 / el.price;
					allCrptCmpr.push({ symbol, factor });
				}
			});
			allCrptCmpr.sort((a, b) => a.symbol.localeCompare(b.symbol));
			cptoDsply.innerHTML = allCrptCmpr
				.map(o => `<option value="${o.symbol}">${o.symbol}</option>`)
				.join("");
			cptoDsply.value = "USDT";
		}
	}

	if (exchs.includes(exchangeId)) dspl = "inline-block";
	else crptChos = "block";
	gebi("crptChos").style.display = crptChos;
	gebi("noteYahoo").style.display = dspl;
	crncDsply.style.display = dspl;
	cptoDsply.style.display = crptCmprLt;
	factorPric = 1;
	try {
		let response,
			data,
			symbols = [],
			bdy;
		switch (exchangeId) {
			case "binance": //tickerPriceUrl
				if (localStorage.binance)
					allPricesBnc = JSON.parse(localStorage.binance);
				else {
					response = await fetch(exchange.tickerPriceUrl);
					allPricesBnc = await response.json();
					localStorage.binance = JSON.stringify(allPricesBnc);
				}
				symbols = allPricesBnc.map(s => s.symbol);
				allSmblBnc = symbols;
				break;
			case "kucoin":
				bdy = {
					action: "cryptoSymbols",
					url: exchange.exchangeInfoUrl,
				};
				response = await smblsLclStrg(exchangeId, 1, ftchFnctnAPPs, bdy);
				symbols = response;
				allPricesKucoin = symbols;

				break;
			case "coingecko":
				response = await fetch(exchange.exchangeInfoUrl);
				data = await response.json();
				symbols = data.map(s => s.id); // مثل: ['bitcoin', 'ethereum']
				break;
			case "okx":
				response = await fetch(exchange.tickerPriceUrl);
				allPricesOkx = await response.json();
				allPricesOkx = allPricesOkx.data;
				console.log(allPricesOkx);
				symbols = allPricesOkx.map(s => s.instId);
				break;
			case "bybit":
				response = await fetch(exchange.exchangeInfoUrl);
				data = await response.json();
				allPrices = data.result.list;
				//.filter(s => s.symbol.includes("USDT") );
				symbols = allPrices.map(s => s.symbol);
				break;
			case "bitget":
				response = await fetch(exchange.tickerPriceUrl);
				data = await response.json();
				allPrices = data.data;
				symbols = allPrices.map(s => s.symbol);
				break;
			case "coincap":
				response = await fetch(exchange.tickerPriceUrl);
				data = await response.json();
				symbols = data.data.filter(s => s.symbol); // تصفية تقريبية
				break;
			case "coinmarketcap":
				response = await fetch(getPriceUrl, {
					method: "POST",
					body: JSON.stringify({ action: "symbols" }),
				});
				data = await response.json();
				symbols = data.smbls.map(s => s.symbol);
				break;
			case "kraken":
				response = await fetch(exchange.exchangeInfoUrl);
				data = await response.json();
				let aa = data.result; //.map(s => s.altname);
				let bb = Object.entries(aa);
				symbols = bb.map(s => s[0]);
				break;
			case "coinbase":
				response = await fetch(exchange.exchangeInfoUrl);
				data = await response.json();
				symbols = data.filter(s => !s.trading_disabled).map(s => s.id);
				break;
			case "cryptocompare":
				response = await fetch(exchange.exchangeInfoUrl);
				data = await response.json();
				symbols = Object.keys(data.Data);
				break;
			case "nasdaq":
			case "nyse":
			case "XSES":
			case "LSE":
			case "NSE":
			case "HKEX":
			case "SIX":
			case "XSWX":
			case "XPAR":
			case "XSHG":
			case "XPAR":
			case "XSHE":
			case "gateIoSmbls":
				symbols = await smblsLclStrg(exchangeId, 30, gtDataStocks);
				break;
			case "other":
				symbols = otherPrpos;
				break;
			default:
				console.warn(`Exchange info parsing not implemented for ${exchangeId}`);
				return [];
		}
		dropdownList.innerHTML = "";
		if (symbols.length > 0) {
			symbols.sort();
			allCrpto = symbols; // حفظ جميع العملات في متغير عام
			const slcCrpt = symbols.splice(0, 100);
			slcCrpt.forEach(s => {
				const div = createDiv(s);
				dropdownList.appendChild(div);
			});
			searchPrice.value = slcCrpt[0];
			if (exchangeId == "cryptocompare") searchPrice.value = "BTC";
			setTimeout(() => {
				startPriceUpdates();
				symbols.forEach(s => {
					const div = createDiv(s);
					dropdownList.appendChild(div);
				});
				//refreshWidget()
			}, 10);
		} else {
			searchPrice.placeholder = "لا توجد أزواج  متاحة، الرجاء اختيار منصة أخرى";
			if (priceUpdateInterval) clearInterval(priceUpdateInterval);
		}
		rfrsh = 0;
	} catch (error) {
		console.error(`حدث خطأ في جلب أزواج العملات من ${exchange.name} : `, error);
		currentPriceDisplay.textContent = "خطأ, إعادة التحميل.";
		searchPrice.placeholder = "خطأ, إعادة التحميل";
		if (priceUpdateInterval) clearInterval(priceUpdateInterval);
		console.log("3awd wla " + error);

		rfrsh++;
		if (rfrsh < 3) {
			//	fetchTradingPairs(exchangeId);
		}
	}
}
async function fetchCurrentPrice(
	exchangeId,
	symbol,
	prmrFtch = false,
	brwsrAlrt = false,
) {
	const exchange = EXCHANGES[exchangeId];
	if (!exchange) return null;
	rfrsh++;
	try {
		let apiUrl = "";
		let price = null;
		let response, data, rslt;
		switch (exchangeId) {
			case "binance":
				if (prmrFtch) {
					price = bncWebSocket(symbol);
				} else if (brwsrAlrt) {
					const response = await fetch(
						`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
					);
					const data = await response.json();
					price = data.price;
				} else {
					//await checkForBrowserAlerts();
					return null;
				}
				break;
			case "kucoin":
				if (prmrFtch) connectKuCoinWS(symbol);
				else if (brwsrAlrt) {
					bdy = {
						action: "gtPrice",
						url: exchange.exchangeInfoUrl,
						symbol,
					};
					data = await smblsLclStrg(exchangeId, 1, ftchFnctnAPPs, bdy);
					if (data.data.price) price = parseFloat(data.data.price);
				}
				break;
			case "coingecko":
				apiUrl = `${exchange.tickerPriceUrl}?ids=${symbol}&vs_currencies=usd`;
				response = await fetch(apiUrl).then(res => res.json());
				price = response[symbol].usd;
				break;
			case "okx":
				if (prmrFtch) connectOKX(symbol);
				price = allPrices.find(obj => obj.instId == symbol).last;
				break;
			case "bybit":
				price = allPrices.find(obj => obj.symbol == symbol).lastPrice;
				connectBybit(symbol);
				break;
			case "bitget":
				price = allPrices.find(obj => obj.symbol == symbol).close;
				break;
			case "kraken":
				//apiUrl = ;
				response = await fetch(`${exchange.tickerPriceUrl}?pair=${symbol}`);
				data = await response.json();
				if (data.error && data.error.length > 0) {
					console.error("Kraken API Error:", data.error);
				} else {
					const pairKey = Object.keys(data.result)[0];
					price = parseFloat(data.result[pairKey].c[0]); // السعر الحالي (close field)
				}
				break;
			case "coinbase":
				let urll = `https://api.exchange.coinbase.com/products/${symbol}/ticker`;
				response = await fetch(urll);
				data = await response.json();
				price = data.price;
				break;
			case "cryptocompare":
				const urlcompar = exchange.gturl(symbol);
				response = await fetch(urlcompar);
				if (!response.ok) throw new Error("فشل في جلب البيانات");
				data = await response.json();
				price = data["USDT"] * factorPric;
				break;
			case "nasdaq":
			case "nyse":
			case "XSES":
			case "LSE":
			case "NSE":
			case "HKEX":
			case "SIX":
			case "XSWX":
			case "XPAR":
			case "XSHG":
			case "XPAR":
			case "XSHE":
			case "other":
				const timeInMs = Date.now();
				rslt = await ftchFnctn({ action: "gtPr", smbl: symbol });
				console.log(rslt);
				if (rslt.error && rfrsh < 3) {
					//await fetchCurrentPrice(exchangeId, symbol, prmrFtch, brwsrAlrt);
					return false;
				}
				if (rslt.symbol != symbol) gebi("searchPrice").value = rslt.symbol;
				currencyFtch = rslt.currency;
				price = rslt.price;
				crncDsply.value = currencyFtch;
				if (!crncDsply.value) {
					crncDsply.innerHTML += `<option value="${currencyFtch}">${currencyFtch}</option>`;
					crncDsply.value = currencyFtch;
				}
				const timeInMs2 = Date.now();
				const dfrns = timeInMs2 - timeInMs;
				console.log(dfrns);
				break;
			default:
				console.error("منصة غير مدعومة لجلب السعر:", exchangeId);
				break;
		}

		if (price !== null) {
			currentPrice = parseFloat(price);
			if (brwsrAlrt) return currentPrice;
			currentPriceDisplay.textContent = `${currentPrice} `;
			if (prmrFtch) {
				targetPriceInput.value = currentPrice; // تعيين السعر الحالي كقيمة افتراضية لحقل السعر المستهدف
				document
					.querySelectorAll(".prcTrgt")
					.forEach(el => (el.innerHTML = currentPrice));
			}
			//await checkForBrowserAlerts(); // فحص تنبيهات للتطبيق عند تحديث السعر
			//return currentPrice;
		}
		rfrsh = 0;
	} catch (error) {
		console.error(`حدث خطأ في جلب سعر ${symbol} من ${exchange.name}:`, error);
		currentPriceDisplay.textContent = "خطأ في جلب السعر.";
		currentPrice = null;
		if (rfrsh < 3) {
			console.log("3awd wla rfrsh : " + rfrsh);
			//fetchCurrentPrice(exchangeId, symbol, prmrFtch);
		}
		//return null;
	}
}

function startPriceUpdates() {
	if (priceUpdateInterval) {
		clearInterval(priceUpdateInterval);
	}
	selectedSymbol = searchPrice.value;
	if (selectedSymbol && currentExchangeId) {
		//if (binanceSocket && binanceSocketSmbl === selectedSymbol) return;

		fetchCurrentPrice(currentExchangeId, selectedSymbol, true); // جلب السعر الحالي عند بدء التحديثات
		priceUpdateInterval = setInterval(() => {
			console.log("priceUpdateInterval is : " + priceUpdateInterval);
			fetchCurrentPrice(currentExchangeId, selectedSymbol);
		}, 300000 /* EXCHANGES[currentExchangeId].intervalData */); //5 minut
	} else {
		currentPriceDisplay.textContent = "--.--";
		currentPrice = null;
	}
}
