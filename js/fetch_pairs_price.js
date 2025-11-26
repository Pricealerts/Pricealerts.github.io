// *** استبدل هذا برابط Web app URL الخاص بـ Google Apps Script الذي ستنشئه ***
let getPriceUrl =
	"https://script.google.com/macros/s/AKfycbyg0QZ6udY-A2E8r_Q5rwr46HKUgFxV2h1MvKW1xJtYBBx2OJAmQo5zBM_fYsGhjvU6/exec";
const APPS_SCRIPT_WEB_APP_URL =
	"https://europe-west1-pricealert-31787.cloudfunctions.net/proxyRequestV2";

let currencyFtch = "USD";
let priceFtch;

const MAX_ALERTS = 5; // يمكن تغيير هذا الحد الأقصى للتنبيهات

// تعريف جميع المنصات المدعومة وواجهات برمجة التطبيقات الخاصة بها
// --- وظائف جلب البيانات وتحديث الأسعار ---



async function fetchTradingPairs(exchangeId) {
	const exchange = EXCHANGES[exchangeId];
	console.log(exchangeId);

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
			case "xetra":
			case "lse":
			case "TSE":
			case "HKSE":
			case "NSE":
				let nmbrDays = 10;
				let localExSmbls = localStorage.getItem(exchangeId);
				const today = new Date();

				if (localExSmbls) {
					localExSmbls = JSON.parse(localExSmbls);
					const locaTim = new Date(localExSmbls.time);
					nmbrDays = Math.floor((today - locaTim) / (1000 * 60 * 60 * 24));
				}

				if (nmbrDays < 8) {
					symbols =JSON.parse(localExSmbls.symbols) ;
				} else {
					response = await fetch(exchange.exchangeInfoUrl, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							action: "stocksExchange",
							querySmble: exchangeId, //.toUpperCase(),
						}),
					});
					data = await response.json();

					// storage data
					const tolclStrg = { symbols: data, time: today };
					localStorage[exchangeId] = JSON.stringify(tolclStrg);
					
					symbols = JSON.parse(data);
				}

				//console.log(symbols);
				/* symbols = nasdaqStocks; */

				break;
			case "other":
				/* response = await fetch(exchange.exchangeInfoUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "stocksExchange", querySmble: "other" }),
				});
				symbols = await response.json(); */
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
			selectedSymbol = symbols[0];
			searchPrice.value = selectedSymbol;
			setTimeout(() => {
				startPriceUpdates();
			}, 100);
		} else {
			searchPrice.placeholder = "لا توجد أزواج  متاحة، الرجاء اختيار منصة أخرى";
			if (priceUpdateInterval) clearInterval(priceUpdateInterval);
		}
		rfrsh = 0;
	} catch (error) {
		//console.error(`حدث خطأ في جلب أزواج العملات من ${exchange.name}:`, error);
		currentPriceDisplay.textContent = "خطأ, إعادة التحميل.";
		searchPrice.placeholder = "خطأ, إعادة التحميل";
		if (priceUpdateInterval) clearInterval(priceUpdateInterval);
		console.log("3awd wla " + err);

		rfrsh++;
		if (rfrsh < 5) {
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
			case "xetra":
			case "lse":
			case "TSE":
			case "HKSE":
			case "NSE":
			case "other":
				response = await fetch(exchange.tickerPriceUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "price", querySmble: symbol }),
				});
				data = await response.json();
				rslt = JSON.parse(data);
				currencyFtch = rslt.currency;
				price = rslt.close;
				priceFtch = price;

				break;
			/* case "other":
				response = await fetch(exchange.tickerPriceUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "price", querySmble: symbol }),
				});
				data = await response.json();
				rslt = JSON.parse(data);
				currencyFtch = rslt.currency;
				price = rslt.close;
				priceFtch = price;
				break;  */
			//querySmbl = encodeURIComponent('BMW.DE')
			default:
				console.error("منصة غير مدعومة لجلب السعر:", exchangeId);
				break;
		}
		//console.log(data);

		usdDsply.value = currencyFtch;

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
			checkForBrowserAlerts(); // فحص تنبيهات المتصفح عند تحديث السعر
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
		if (rfrsh < 5) {
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
