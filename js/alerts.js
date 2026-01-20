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
function renderAlerts(alerts ,alertsList= gebi("alertsList")) {
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
			alTp,
		} = alert[1];
		let conditionText = "";
		if (alertCondition === "l") {
			conditionText = "عندما يصبح السعر أصغر أو يساوي";
		} else if (alertCondition === "g") {
			conditionText = "عندما يصبح السعر أكبر أو يساوي";
		}
		const listItem = document.createElement("li");
		let dltAlrt = alert[0];
		let tpAlrt = "(النوع: تطبيق)";
		let btnDlt = "notif";
		if (alTp === "t") {
			dltAlrt = JSON.stringify({
				alertId: alert[0],
				telegramChatId: "cht" + telegramChatId,
			});
			tpAlrt = `(النوع: تيليجرام)
				<br>   المعرف:   
				 ${telegramChatId}  `;
			btnDlt = "button";
		}

		listItem.innerHTML = `
			<span class="alert-info" >
				<strong>${EXCHANGES[exchangeId].name} - ${symbol}</strong>
				${conditionText} ${targetPrice} 
				${tpAlrt}
			</span>
			<button class="delete-${btnDlt}" 
			data-alert='${dltAlrt}'
			>حذف</button>
		`;
		console.log(listItem);

		alertsList.appendChild(listItem);
	});
	document.querySelectorAll(".delete-button").forEach(button => {
		button.addEventListener("click", event => {
			const alertIdToDelete = JSON.parse(event.target.dataset.alert);
			deleteAlert(alertIdToDelete);
		});
	});
	document.querySelectorAll(".delete-notif").forEach(button => {
		button.addEventListener("click", event => {
			const idDlt = event.target.dataset.alert;
			dltNtf(idDlt);
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
	if (brwsrAlrts.length === 0) return;
	hndlAlrt(currentPrice, selectedSymbol);
	// 1. فلترة العملات الفريدة لتقليل عدد طلبات الـ API
	let symbolsMap = new Map();
	let uniqueAlerts = [];
	brwsrAlrts.forEach(alert => {
		if (!symbolsMap.has(alert.s)) {
			symbolsMap.set(alert.s, true);
			uniqueAlerts.push(alert);
		}
	});

	// 2. إنشاء الوعود ومعالجتها بشكل متوازي
	const alertPromises = uniqueAlerts.map(async uniqueAlert => {
		try {
			// إضافة await هنا ضرورية جداً للحصول على السعر الفعلي
			const price = await fetchCurrentPrice(
				uniqueAlert.e,
				uniqueAlert.s,
				false,
				true,
			);

			// نمرر السعر والرمز لدالة المعالجة
			if (price) {
				hndlAlrt(price, uniqueAlert.s);
			}
		} catch (error) {
			console.error(`خطأ في جلب سعر ${uniqueAlert.s}:`, error);
		}
	});

	// الانتظار حتى تنتهي جميع عمليات جلب الأسعار
	await Promise.all(alertPromises);
}

// دالة المعالجة الداخلية
function hndlAlrt(curentPrice, slctdSmbl) {
	const alertsForThisSymbol = brwsrAlrts.filter(alert => alert.s === slctdSmbl);

	alertsForThisSymbol.forEach(alert => {
		let shouldTrigger = false;
		if (alert.c === "l" && curentPrice <= alert.t) shouldTrigger = true;
		else if (alert.c === "g" && curentPrice >= alert.t) shouldTrigger = true;

		if (shouldTrigger) {
			showBrowserNotification(alert.s, curentPrice, alert.t, alert.c);
			// مسح التنبيه بعد تنفيذه لمنع التكرار
			dltNtf(alert.id);
		}
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
