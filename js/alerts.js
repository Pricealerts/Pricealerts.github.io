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
	alrtsStorg.forEach(([, alert]) => {
		const { e, e2: exch = e, s: smbl } = alert;
		if (!symbolsMap.has(smbl)) {
			symbolsMap.set(smbl, exch);
			if (!exch == "binance") chkBrwsrY = true;
			if (exch == "binance") chkBrwsrBnc = true;
		}
	});
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
			s: symbol,
			t: targetPrice,
			c: alrtCndchn, //alertCondition
			alTp = "t",
		} = alert[1];
		let cndtnTxt =
			alrtCndchn === "g"
				? "عندما يصبح السعر أكبر أو يساوي"
				: "عندما يصبح السعر أصغر أو يساوي"; //condichionText

		const listItem = document.createElement("li");
		let dltAlrt = `dltNtf(${alert[0]})`;
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
	if (chkBrwsrBnc) bncWebSocketMult();
}
let chkBrwsrIntrvl, chkBrwsrY, chkBrwsrBnc;
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
	const symbolsOrder = Array.from(symbolsMap);
	const promises = symbolsOrder
		.map(async ([s, e]) => {
			if (e == "binanace") return false; // تخطي هذه المنصات
			return fetchCurrentPrice(
				e, // المنصة
				s, // الرمز
				false,
				true,
			).catch(err => {
				console.error(`❌ Error fetching ${e} from ${s} err is  :`);
				console.error(err);
				return null;
			});
		})
		.filter(Boolean);
	const results = await Promise.all(promises);
	const hndlPr = [];
	results.forEach((data, index) => {
		const symbol = symbolsOrder[index][0];
		hndlPr.push(hndlAlrt(data, symbol));
	});
	await Promise.all(hndlPr);
}

// دالة المعالجة الداخلية
async function hndlAlrt(curentPrice, slctdSmbl) {
	const alertsForThisSymbol = alrtsStorg.filter(([, a]) => a.s === slctdSmbl);
	const proms = [];
	alertsForThisSymbol.forEach(async alerte => {
		const alert = alerte[1];
		const id = alerte[0];
		curentPrice *= alert.f;
		if (
			(alert.c === "l" && curentPrice <= alert.t) ||
			(alert.c === "g" && curentPrice >= alert.t)
		) {
			if (alert.alTp === "t")
				proms.push(
					deleteAlert({
						id: id,
						telegramChatId: "cht" + telegramChatId,
					}),
				);
			else showBrowserNotification(alert.s, curentPrice, alert.t, alert.c);
			await Promise.all(proms);
			dltNtf(id);
		}
	});
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
