// --- وظائف مساعدة ---

async function loadUserAlertsDisplay() {
	try {
		const rslt = await ftchFnctn(FIREBASE_WEB_ALERT_URL, {
			action: "gtAlerts",
			chid: telegramChatId,
		});
		let aryRslt = Object.entries(rslt);
		// تحويل المصفوفة إلى نص JSON قبل الحفظ
		if (!aryRslt) aryRslt = [];
		localStorage.setItem("alrtsStorg", JSON.stringify(aryRslt));
		renderAlerts(aryRslt);
	} catch (err) {
		console.error("خطأ في تحميل التنبيهات:", err.message);
		const alertsList = gebi("alertsList");
		alertsList.innerHTML =
			'<li class="no-alerts-message" style="color:red;">خطأ في تحميل التنبيهات.</li>';
	}
}
function renderAlerts(alerts) {
	//const allAlrts = [...alerts,...brwsrAlrts]
	alertsList.innerHTML = "";
	if (!alerts || alerts.length === 0) {
		alertsList.innerHTML =
			'<li class="no-alerts-message">لا توجد تنبيهات نشطة حاليًا.</li>';
		return;
	}
	alerts.forEach(alert => {
		const {
			e: exchangeId,
			s: symbol,
			t: targetPrice,
			c: alertCondition,
		} = alert[1];
		let conditionText = "";
		if (alertCondition === "l") {
			conditionText = "عندما يصبح السعر أصغر أو يساوي";
		} else if (alertCondition === "g") {
			conditionText = "عندما يصبح السعر أكبر أو يساوي";
		}
		const listItem = document.createElement("li");
		const dltAlrt = JSON.stringify({
			alertId: alert[0],
			telegramChatId: "cht" + telegramChatId,
		});
		//console.log('sdfsf is :');

		//console.log(EXCHANGES[exchangeId].name);

		listItem.innerHTML = `
			<span class="alert-info" >
				<strong>${EXCHANGES[exchangeId].name} - ${symbol}</strong>
				${conditionText} ${targetPrice} 
				(النوع: تيليجرام)
				<br>   المعرف:   
				 ${telegramChatId}  
			</span>
			<button class="delete-button" 
			data-alert='${dltAlrt}'
			>حذف</button>
		`;
		alertsList.appendChild(listItem);
	});
	document.querySelectorAll(".delete-button").forEach(button => {
		button.addEventListener("click", event => {
			const alertIdToDelete = JSON.parse(event.target.dataset.alert);

			deleteAlert(alertIdToDelete);
		});
	});
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
/* function showBrowserNotification2(symbol, price, targetPrice, condition) {
	let conditionText = "";
	if (condition === "l") {
		conditionText = `أصبح ≥ ${targetPrice} USDT`;
	} else if (condition === "g") {
		conditionText = `أصبح ≤ ${targetPrice} USDT`;
	}
	dltNtf(idDlt);
	if (Notification.permission === "granted") {
		new Notification(`تنبيه سعر ${symbol}!`, {
			body: `وصل السعر إلى ${price} USDT. ${conditionText}`, //https://www.google.com/s2/favicons?domain=binance.com
			icon: "../imgs/web/icon-512.png", // يمكنك تغيير الأيقونة حسب المنصة
		});
	} else if (Notification.permission === "default") {
		requestNotificationPermission();
	}
} */
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

async function checkForBrowserAlerts() {
	if (currentPrice === null) return;
	hndlAlrt(currentPrice, selectedSymbol);

	let symbolsMap = new Map();
	let aryAlrts = [];
	brwsrAlrts.forEach(alert => {
		if (!symbolsMap.has(alert.symbol)) {
			symbolsMap.set(alert.symbol, true);
			aryAlrts.push(alert);
		}
	});
	const promeses = aryAlrts.map(alert => {
		const price = fetchCurrentPrice(
			alert.exchangeId,
			alert.symbol,
			false,
			true
		);
		if (!price) return;
		hndlAlrt(price, alert.symbol);
	});
	await Promise.all(promeses);

	function hndlAlrt(curentPrice, slctdSmbl) {
		const slctSmbl = brwsrAlrts.filter(alert => alert.symbol === slctdSmbl);
		slctSmbl.forEach(alert => {
			let shouldTrigger = false;
			if (alert.alertCondition === "l" && curentPrice <= alert.targetPrice) {
				shouldTrigger = true;
			} else if (
				alert.alertCondition === "g" &&
				curentPrice >= alert.targetPrice
			) {
				shouldTrigger = true;
			}
			if (shouldTrigger) {
				showBrowserNotification(
					alert.symbol,
					curentPrice,
					alert.targetPrice,
					alert.alertCondition
				);
				dltNtf(alert.id);
				//alert.status = "Triggered"; // لمنع التنبيه المتكرر على نفس السعر
			}
		});
	}
}

function renderAlNotfcation() {
	alertsListNtf.innerHTML = "";
	if (!brwsrAlrts || brwsrAlrts.length === 0) {
		alertsListNtf.innerHTML =
			'<li class="no-alerts-message">لا توجد تنبيهات نشطة حاليًا.</li>';
		return;
	}
	brwsrAlrts.forEach(alert => {
		const { id, exchangeId, symbol, targetPrice, alertCondition } = alert;
		let conditionText = "";
		if (alertCondition === "l") {
			conditionText = "عندما يصبح السعر أصغر أو يساوي";
		} else if (alertCondition === "g") {
			conditionText = "عندما يصبح السعر أكبر أو يساوي";
		}
		const listItem = document.createElement("li");
		listItem.id = id;
		listItem.innerHTML = `
			<span  class="alert-info" >
				<strong>${EXCHANGES[exchangeId].name} - ${symbol}</strong>
				${conditionText} ${targetPrice} (النوع: تطبيق)
			</span>
			<button class="delete-notif" 
			data-alert='${id}'
			>حذف</button>
		`;
		alertsListNtf.appendChild(listItem);
	});
	document.querySelectorAll(".delete-notif").forEach(button => {
		button.addEventListener("click", event => {
			const idDlt = event.target.dataset.alert;
			dltNtf(idDlt);
		});
	});
}

function dltNtf(idDlt) {
	gebi(idDlt).remove();
	brwsrAlrts = brwsrAlrts.filter(el => el.id != idDlt);
	localStorage.setItem("brwsrAlrts", JSON.stringify(brwsrAlrts));
	if (!brwsrAlrts || brwsrAlrts.length === 0) {
		alertsListNtf.innerHTML =
			'<li class="no-alerts-message">لا توجد تنبيهات نشطة حاليًا.</li>';
	}
}



let result = [1, 2, 3, 4].reduce((acc, n) => {
	acc.push(n * 2);
	return acc;
}, []);
console.log(result); // Output: [2, 4, 6, 8]





