async function loadUserAlertsDisplay() {
	try {
		const rslt = await dataAlrts(telegramChatId);
		let aryRslt = [];
		if (rslt) aryRslt = Object.entries(rslt) || [];
		const browserAlerts = alrtsStorg.filter(alert => alert[1].alTp === "b");
		alrtsStorg = [...browserAlerts, ...aryRslt];
		localStorage.setItem("alrtsStorg", JSON.stringify(alrtsStorg));
		renderAlerts();
	} catch (err) {
		console.error("خطأ في تحميل التنبيهات:", err);
		gebi("alertsList").innerHTML =
			'<li class="no-alerts-message" style="color:red;">خطأ في تحميل التنبيهات.</li>';
	}
}
function renderAlerts() {
	const brwAlrts = alrtsStorg.filter(alert => alert[1].alTp === "b");
	const tlgAlrts = alrtsStorg.filter(alert => alert[1].alTp !== "t");
	let alrtlst = gebi("alertsListNtf");
	alrtlst.innerHTML = !brwAlrts.length
		? '<li class="no-alerts-message">لا توجد تنبيهات نشطة حاليًا.</li>'
		: "";

	gebi("alertsList").innerHTML = !tlgAlrts.length
		? '<li class="no-alerts-message">لا توجد تنبيهات نشطة حاليًا.</li>'
		: "";
	alrtsStorg.forEach(alert => {
		const {
			e: exchangeId,
			e2: exchngeId2 = exchangeId,
			s: symbol,
			s2: smbl = symbol,
			t: targetPrice,
			c: alrtCndchn, //alertCondition
			alTp = "t",
		} = alert[1];
		if (!symbolsMap.has(smbl)) {
			symbolsMap.set(smbl, exchngeId2);
			if (exchngeId2 !== "binance") chkBrwsrY = true;
		}
		let cndtnTxt =
			alrtCndchn === "g"
				? "عندما يصبح السعر أكبر أو يساوي"
				: "عندما يصبح السعر أصغر أو يساوي"; //condichionText

		const listItem = document.createElement("li");
		let dltAlrt = `dltNtf('${alert[0]}')`;
		let tpAlrt = "(النوع: تطبيق)";
		if (alTp === "t") {
			alrtlst = gebi("alertsList");
			dltAlrt = `deleteAlert(${JSON.stringify({
				alertId: alert[0],
				telegramChatId: "cht" + telegramChatId,
			})})`;
			tpAlrt = `(النوع: تيليجرام)
				<br>   المعرف:   
				 ${telegramChatId}  `;
		}
		listItem.id = alert[0];
		listItem.innerHTML = `
			<span class="alert-info" >
				<strong>${EXCHANGES[exchangeId].name} - ${symbol}</strong>
				${cndtnTxt} ${targetPrice} 
				${tpAlrt}
			</span>
			<button class="delete-button" 
			onclick = ${dltAlrt}
			>حذف</button>
		`;
		alrtlst.appendChild(listItem);
	});
	brwsrAlrtIntrvl();
	bncWebSocketMult();
}
let chkBrwsrIntrvl,
	chkBrwsrY = false;
function brwsrAlrtIntrvl() {
	if (chkBrwsrIntrvl || !chkBrwsrY) return;
	if (chkBrwsrIntrvl && !chkBrwsrY) {
		clearInterval(chkBrwsrIntrvl);
		return;
	}
	chkBrwsrIntrvl = setInterval(
		() => checkForBrowserAlerts(),
		300000, //5 minut
	);
}

async function checkForBrowserAlerts() {
	if (alrtsStorg.length === 0) return;
	const crptoExch = [
		"binance",
		"mexc",
		"kucoin",
		"coingecko",
		"okx",
		"bybit",
		"bitget",
		"lbank",
		"coincap",
		"kraken",
		"coinbase",
		"cryptocompare",
	];
	const symbolsOrder = Array.from(symbolsMap);
	const stocks = [];
	const promises = symbolsOrder
		.map(async ([s2, e]) => {
			if (e == "binanace") return false; // تخطي هذه المنصات
			if (!crptoExch.includes(e)) {
				stocks.push(s2);
				return false;
			}
			return fetchCurrentPrice(
				e, // المنصة
				s2, // الرمز
				false,
				true,
			).catch(err => {
				console.error(`❌ Error fetching ${e} from ${s2} err is  :`);
				console.error(err);
				return false;
			});
		})
		.filter(Boolean);
	const results = await Promise.all(promises);
	if (stocks.length) {
		const gtStocks = await ftchFnctnAPPs({
			action: "arryPrice",
			smbls: stocks,
		});
		results.push(...gtStocks);
	}
	const hndlPr = [];
	results.forEach(data => {
		//const symbol = symbolsOrder[index][0];
		hndlPr.push(hndlAlrt(...data));
	});
	await Promise.all(hndlPr);
}

// دالة المعالجة الداخلية
async function hndlAlrt(slctdSmbl, curentPrice) {
	const alertsForThisSymbol = alrtsStorg.filter(
		([, a]) => a.s === slctdSmbl || a.s2 === slctdSmbl,
	);
	const proms = [];
	alertsForThisSymbol.forEach(async alerte => {
		const alert = alerte[1];
		const id = alerte[0];
		curentPrice *= alert.f;

		if (
			(alert.c === "l" && curentPrice <= alert.t) ||
			(alert.c === "g" && curentPrice >= alert.t)
		) {
			alerte.prc = curentPrice;
			if (alert.alTp === "t")
				proms.push(
					deleteAlert({
						alertId: id,
						telegramChatId: "cht" + telegramChatId,
						alrt: alerte,
					}),
				);
			else showBrowserNotification(alert.s, curentPrice, alert.t, alert.c);
			dltNtf(id);
		}
	});
	await Promise.all(proms);
}

function dltNtf(idDlt) {
	gebi(idDlt).remove();
	alrtsStorg = alrtsStorg.filter(([id]) => id !== idDlt);
	localStorage.setItem("alrtsStorg", JSON.stringify(alrtsStorg));
	if (!alrtsStorg || alrtsStorg.length === 0) {
		alertsListNtf.innerHTML =
			'<li class="no-alerts-message">لا توجد تنبيهات نشطة حاليًا.</li>';
	}
}

// --- وظائف التنبيهات (تم تبسيطها) ---
function requestNotificationPermission() {
	if (!("Notification" in window)) {
		// alert("هذا للتطبيق لا يدعم إشعارات سطح المكتب.");
	} else if (Notification.permission === "default") {
		Notification.requestPermission().then(permission => {
			if (permission === "granted") {
				console.log("تم منح إذن الإشعارات.");
			} else {
				console.warn("لم يتم منح إذن الإشعارات.");
				alertStatus.textContent = "لم يتم منح إذن الإشعارات.";
				alertStatus.style.color = "red";
			}
		});
	}
}

function showBrowserNotification(symbol, price, targetPrice, condition) {
	let conditionText =
		condition === "l"
			? `أصبح ≥ ${targetPrice} USDT`
			: `أصبح ≤ ${targetPrice} USDT`;

	if (Notification.permission === "granted") {
		// المحاولة عبر Service Worker (أفضل للهواتف)
		navigator.serviceWorker.ready.then(function (registration) {
			registration.showNotification(`تنبيه سعر ${symbol}!`, {
				body: `وصل السعر إلى ${price} USDT. ${conditionText}`,
				icon: "../imgs/web/icon-512.png",
				vibrate: [200, 100, 200], // إضافة اهتزاز للهاتف
				tag: "price-alert", // لمنع تكرار التنبيهات
			});
		});
	} else {
		requestNotificationPermission();
	}
}
const ggghhh = {trdtsd : 'fdqdqsd'}
const quoteZ = ggghhh["Global Quote"]|| false
console.log(quoteZ);

/* 
const fsqd = [
	{
		meta: {
			currency: "SGD",
			symbol: "1A0.SI",
			exchangeName: "SES",
			fullExchangeName: "SES",
			instrumentType: "EQUITY",
			firstTradeDate: 1478134800,
			regularMarketTime: 1771488629,
			hasPrePostMarketData: false,
			gmtoffset: 28800,
			timezone: "SGT",
			exchangeTimezoneName: "Asia/Singapore",
			regularMarketPrice: 0.037,
			fiftyTwoWeekHigh: 0.052,
			fiftyTwoWeekLow: 0.032,
			regularMarketDayHigh: 0.04,
			regularMarketDayLow: 0.037,
			regularMarketVolume: 207200,
			longName: "Katrina Group Ltd.",
			shortName: "$ Katrina",
			chartPreviousClose: 0.038,
			previousClose: 0.038,
			scale: 3,
			priceHint: 4,
			currentTradingPeriod: {
				pre: {
					timezone: "SGT",
					start: 1771547400,
					end: 1771549200,
					gmtoffset: 28800,
				},
				regular: {
					timezone: "SGT",
					start: 1771549200,
					end: 1771578000,
					gmtoffset: 28800,
				},
				post: {
					timezone: "SGT",
					start: 1771578000,
					end: 1771578000,
					gmtoffset: 28800,
				},
			},
			tradingPeriods: [
				[
					{
						timezone: "SGT",
						start: 1771462800,
						end: 1771491600,
						gmtoffset: 28800,
					},
				],
			],
			dataGranularity: "1h",
			range: "1d",
			validRanges: [
				"1d",
				"5d",
				"1mo",
				"3mo",
				"6mo",
				"1y",
				"2y",
				"5y",
				"10y",
				"ytd",
				"max",
			],
		},
		timestamp: [1771477200, 1771480800, 1771484400, 1771488000],
		indicators: {
			quote: [
				{
					low: [
						0.03700000047683716,
						null,
						0.03700000047683716,
						0.03700000047683716,
					],
					open: [
						0.03700000047683716,
						null,
						0.03700000047683716,
						0.03700000047683716,
					],
					volume: [118200, null, 4000, 23000],
					close: [
						0.03700000047683716,
						null,
						0.03700000047683716,
						0.03700000047683716,
					],
					high: [
						0.03999999910593033,
						null,
						0.03700000047683716,
						0.03700000047683716,
					],
				},
			],
		},
	},
];
 */