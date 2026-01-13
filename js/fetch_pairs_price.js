// *** استبدل هذا برابط Web app URL الخاص بـ Google Apps Script الذي ستنشئه ***
let getPriceUrl =
	"https://script.google.com/macros/s/AKfycbyg0QZ6udY-A2E8r_Q5rwr46HKUgFxV2h1MvKW1xJtYBBx2OJAmQo5zBM_fYsGhjvU6/exec";
const FIREBASE_WEB_ALERT_URL =
	"https://europe-west1-pricealert-31787.cloudfunctions.net/proxyRequestV2";

let currencyFtch = "USD";

const MAX_ALERTS = 50; // يمكن تغيير هذا الحد الأقصى للتنبيهات
// تعريف جميع المنصات المدعومة وواجهات برمجة التطبيقات الخاصة بها
// --- وظائف جلب البيانات وتحديث الأسعار ---

async function fetchTradingPairs(exchangeId) {
	const exchange = EXCHANGES[exchangeId];

	gebi("usdDsply").style.display = "none";
	if (!exchange) {
		currentPriceDisplay.textContent = "منصة غير متاحة.";
		searchPrice.placeholder = "الرجاء اختيار منصة صحيحة";
		return;
	}

	try {
		let symbols = [];
		let urlCrpts =
			getPriceUrl +
			"?action=getCryptoSymbols&urlSmbls=" +
			exchange.exchangeInfoUrl;
		gebi("crptChos").style.display = exchange.crptChos;
		gebi("usdDsply").style.display = exchange.usdDsply;
		gebi("noteYahoo").style.display = exchange.usdDsply;

		let response, data;
		switch (exchangeId) {
			case "binance":
				response = await fetch(exchange.tickerPriceUrl);
				allPrices = await response.json();
				symbols = allPrices.map(s => s.symbol);
				const dd = allPrices.find(obj => obj.symbol == "DASHUSDT").price;
				console.log(dd);
				
				break;
			case "mexc":
				response = await fetch(urlCrpts);
				allPrices = await response.json();

				symbols = allPrices
					.filter(s => s.symbol.endsWith(exchange.usdtSuffix))
					.map(s => s.symbol);
				break;
			case "kucoin":
				response = await fetch(urlCrpts);
				data = await response.json();
				if (data.code == "200000" && data.data) {
					symbols = data.data
						.filter(
							s => s.symbol.endsWith(exchange.usdtSuffix) && s.enableTrading
						)
						.map(s => s.symbol);
				} else {
					console.error("حدث خطأ في البيانات:", data);
				}
				break;
			case "coingecko":
				response = await fetch(exchange.exchangeInfoUrl);
				data = await response.json();
				//console.log(data);

				// coingecko doesn't return symbol symbols, it returns coin IDs
				symbols = data.map(s => s.id); // مثل: ['bitcoin', 'ethereum']
				break;
			case "okx":
				response = await fetch(exchange.tickerPriceUrl);
				allPrices = await response.json();
				allPrices = allPrices.data;
				symbols = allPrices
					/* .filter(
						s => s.instType === "SPOT" && s.instId.endsWith(exchange.usdtSuffix)
					) */
					.map(s => s.instId /* .replace("-", "") */);
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
			case "lbank":
				response = await fetch(urlCrpts);
				data = await response.json();
				allPrices = await data.data;
				console.log(allPrices);

				symbols = await allPrices.map(s => s.symbol);

				break;
			case "coincap":
				response = await fetch(exchange.tickerPriceUrl);

				data = await response.json();
				symbols = data.data.filter(s => s.symbol && s.symbol.length <= 10); // تصفية تقريبية
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
				let nmbrDays = 100;
				let localExSmbls = localStorage.getItem(exchangeId);
				const today = Date.now();
				if (localExSmbls) {
					localExSmbls = JSON.parse(localExSmbls);
					const locaTim = localExSmbls.time;
					nmbrDays = Math.floor((today - locaTim) / (1000 * 60 * 60 * 24));
				}
				if (nmbrDays < 30) {
					symbols = localExSmbls.symbols;
				} else {
					data = await ftchFnctn(exchange.exchangeInfoUrl, {
						action: "stocksExchange",
						querySmble: exchangeId,
					});
					// storage data
					const tolclStrg = { symbols: data, time: today };
					localStorage[exchangeId] = JSON.stringify(tolclStrg);
					symbols = data;
				}
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

			symbols.forEach(symbol => {
				const div = createDiv(symbol);
				dropdownList.appendChild(div);
			});
			searchPrice.value = symbols[0];
			setTimeout(() => {
				startPriceUpdates();
			}, 100);
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
			fetchTradingPairs(exchangeId);
		}
	}
}
async function fetchCurrentPrice(exchangeId, symbol, isPriceUpdate = false) {
	const exchange = EXCHANGES[exchangeId];
	if (!exchange) return null;
	try {
		let urlCrpts =
			getPriceUrl + "?action=getPrice&urlSmbl=" + exchange.tickerPriceUrl;
		let apiUrl = "";
		let price = null;
		let response, data, rslt;
		switch (exchangeId) {
			case "binance":
				price = allPrices.find(obj => obj.symbol == symbol).price;
				break;
			case "mexc":
				price = allPrices.find(obj => obj.symbol == symbol).price;
				break;
			case "kucoin":
				apiUrl = `${urlCrpts}&symbole=${symbol}`;
				response = await fetch(apiUrl);
				data = await response.json();
				// إذا كانت البيانات تحتوي على رمز السعر
				if (data.code === "200000" && data.data && data.data.price) {
					price = parseFloat(data.data.price);
					rfrsh = 0;
				} else {
					console.error(
						`خطأ من KuCoin API (ticker):`,
						data.msg || JSON.stringify(data)
					);
					rfrsh++;
					console.log("rah f kucoin");

					if (rfrsh < 5) {
						fetchTradingPairs(exchangeId);
					}
				}
				break;
			case "coingecko":
				apiUrl = `${exchange.tickerPriceUrl}?ids=${symbol}&vs_currencies=usd`;
				response = await fetch(apiUrl).then(res => res.json());
				price = response[symbol].usd;
				break;
			case "okx":
				price = allPrices.find(obj => obj.instId == symbol).last;
				break;
			case "bybit":
				price = allPrices.find(obj => obj.symbol == symbol).lastPrice;
				break;
			case "bitget":
				price = allPrices.find(obj => obj.symbol == symbol).close;
				break;
			case "lbank":
				price = await allPrices.find(obj => obj.symbol == symbol).ticker.latest;
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
				rslt = await ftchFnctn(exchange.exchangeInfoUrl, {
					action: "price",
					querySmble: symbol,
				});
				console.log(rslt);
				if (rslt.symbol != symbol) gebi("searchPrice").value = rslt.symbol;
				currencyFtch = rslt.currency;
				price = rslt.close;
				usdDsply.value = currencyFtch;
				if (!usdDsply.value) {
					usdDsply.innerHTML += `<option value="${currencyFtch}">${currencyFtch}</option>`;
					usdDsply.value = currencyFtch;
				}

				break;
			default:
				console.error("منصة غير مدعومة لجلب السعر:", exchangeId);
				break;
		}
		//console.log(data);

		if (price !== null) {
			currentPrice = price;
			currentPriceDisplay.textContent = `${currentPrice} `;
			if (isPriceUpdate) {
				targetPriceInput.value = currentPrice; // تعيين السعر الحالي كقيمة افتراضية لحقل السعر المستهدف
				document
					.querySelectorAll(".prcTrgt")
					.forEach(el => (el.innerHTML = currentPrice));
			}
			rfrsh = 0;
			checkForBrowserAlerts(); // فحص تنبيهات للتطبيق عند تحديث السعر
			return currentPrice;
		} else {
			currentPriceDisplay.textContent = "السعر غير متاح.";
			currentPrice = null;
			rfrsh = 0;
			return null;
		}
	} catch (error) {
		console.error(`حدث خطأ في جلب سعر ${symbol} من ${exchange.name}:`, error);
		currentPriceDisplay.textContent = "خطأ في جلب السعر.";
		currentPrice = null;
		rfrsh++;
		if (rfrsh < 3) {
			console.log("3awd wla rfrsh : " + rfrsh);
			fetchCurrentPrice(exchangeId, symbol, isPriceUpdate);
		}
		return null;
	}
}

function startPriceUpdates() {
	if (priceUpdateInterval) {
		clearInterval(priceUpdateInterval);
	}
	selectedSymbol = searchPrice.value;
	if (selectedSymbol && currentExchangeId) {
			fetchCurrentPrice(currentExchangeId, selectedSymbol, true); // جلب السعر الحالي عند بدء التحديثات

		
		priceUpdateInterval = setInterval(
			() => fetchCurrentPrice(currentExchangeId, selectedSymbol),
			EXCHANGES[currentExchangeId].intervalData
		);
	} else {
		currentPriceDisplay.textContent = "--.--";
		currentPrice = null;
	}
}
