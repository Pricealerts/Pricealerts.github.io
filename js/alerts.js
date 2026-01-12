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
		console.log(aryRslt);

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

function showBrowserNotification(symbol, price, targetPrice, condition) {
	let conditionText = "";
	if (condition === "l") {
		conditionText = `أصبح ≥ ${targetPrice} USDT`;
	} else if (condition === "g") {
		conditionText = `أصبح ≤ ${targetPrice} USDT`;
	}

	if (Notification.permission === "granted") {
		new Notification(`تنبيه سعر ${symbol}!`, {
			body: `وصل السعر إلى ${price} USDT. ${conditionText}`, //https://www.google.com/s2/favicons?domain=binance.com
			icon: "../imgs/web/icon-512.png", // يمكنك تغيير الأيقونة حسب المنصة
		});
	} else if (Notification.permission === "default") {
		requestNotificationPermission();
	}
}

function checkForBrowserAlerts() {
	if (currentPrice === null) return;
	selectedSymbol = searchPrice.value;
	activeBrowserAlerts
		.filter(alert => alert.status === "Active")
		.forEach(alert => {
			if (
				alert.symbol === selectedSymbol &&
				alert.exchangeId === currentExchangeId
			) {
				let shouldTrigger = false;
				if (alert.alertCondition === "l" && currentPrice <= alert.targetPrice) {
					shouldTrigger = true;
				} else if (
					alert.alertCondition === "g" &&
					currentPrice >= alert.targetPrice
				) {
					shouldTrigger = true;
				}

				if (shouldTrigger) {
					setTimeout(() => {
						alertStatus.textContent = "";
					}, 3000);
					showBrowserNotification(
						alert.symbol,
						currentPrice,
						alert.targetPrice,
						alert.alertCondition
					);
					alert.status = "Triggered"; // لمنع التنبيه المتكرر على نفس السعر
					alertStatus.textContent = `تم إرسال تنبيه للتطبيق لـ ${alert.symbol}.`;
					alertStatus.style.color = "green";
				}
			}
		});
}
