// --- وظائف مساعدة ---

async function loadUserAlertsDisplay() {
	const apScrptAndId = APPS_SCRIPT_WEB_APP_URL;

	try {
		await fetch(apScrptAndId, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "gtAlerts", chid: telegramChatId }),
		})
			.then(res => res.json())
			.then(rslt => {
				let aryRslt = JSON.parse(rslt);
				aryRslt = Object.entries(aryRslt);

				
				renderAlerts(aryRslt);
			});
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

	alerts.forEach(alert2 => {
		let alert = alert2[1];
		let conditionText = "";
		if (alert.alertCondition === "less_than_or_equal") {
			conditionText = "عندما يصبح السعر أصغر أو يساوي";
		} else if (alert.alertCondition === "greater_than_or_equal") {
			conditionText = "عندما يصبح السعر أكبر أو يساوي";
		}

		const listItem = document.createElement("li");
		const dltAlrt = JSON.stringify({
			alertId: alert2[0],
			telegramChatId: "cht" + telegramChatId,
		});

		listItem.innerHTML = `
			<span class="alert-info" >
				<strong>${EXCHANGES[alert.exchangeId].name} - ${alert.symbol}</strong>
				${conditionText} ${alert.targetPrice} 
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
		// alert("هذا المتصفح لا يدعم إشعارات سطح المكتب.");
	} else if (Notification.permission === "default") {
		Notification.requestPermission().then(permission => {
			if (permission === "granted") {
				console.log("تم منح إذن الإشعارات.");
			} else {
				console.warn("لم يتم منح إذن الإشعارات.");
			}
		});
	}
}

function showBrowserNotification(symbol, price, targetPrice, condition) {
	let conditionText = "";
	if (condition === "less_than_or_equal") {
		conditionText = `أصبح ≥ ${targetPrice} USDT`;
	} else if (condition === "greater_than_or_equal") {
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

	activeBrowserAlerts
		.filter(alert => alert.status === "Active")
		.forEach(alert => {
			if (
				alert.symbol === selectedSymbol &&
				alert.exchangeId === currentExchangeId
			) {
				let shouldTrigger = false;
				if (
					alert.alertCondition === "less_than_or_equal" &&
					currentPrice <= alert.targetPrice
				) {
					shouldTrigger = true;
				} else if (
					alert.alertCondition === "greater_than_or_equal" &&
					currentPrice >= alert.targetPrice
				) {
					shouldTrigger = true;
				}

				if (shouldTrigger) {
					showBrowserNotification(
						alert.symbol,
						currentPrice,
						alert.targetPrice,
						alert.alertCondition
					);
					alert.status = "Triggered"; // لمنع التنبيه المتكرر على نفس السعر
					alertStatus.textContent = `تم إرسال تنبيه المتصفح لـ ${alert.symbol}.`;
					alertStatus.style.color = "green";
				}
			}
		});
}
// دالة لتعيين/حذف التنبيهات على  farebase
async function manageAlertOnFirebase(action, alertData = null) {
	let data = {};
	alertStatus.textContent = `جاري ${
		action === "setAlert" ? "تعيين" : "حذف"
	} التنبيه...`;
	alertStatus.style.color = "#007bff";

	try {
		const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				action: action,
				...alertData,
			}),
		})
			.then(res => res.json())
			.then(dt => {
				data = JSON.parse(dt);
			});

		if (data.status === "success") {
			alertStatus.textContent = `${
				action === "setAlert" ? "تم تعيين" : "تم حذف"
			} التنبيه بنجاح.`;
			alertStatus.style.color = "green";
			await loadUserAlertsDisplay(); // تحديث قائمة التنبيهات بعد كل عملية
			setTimeout(() => {
				alertStatus.textContent = "";
			}, 3000);
			return true;
		} else if (data.status == "notSuccess") {
			alertStatus.textContent =
				"فشل التأكد من معرّف دردشة التيليجرام (Chat ID) الخاص بك يرجى التأكد منه وإعادة المحاولة";
			alertStatus.style.color = "red";
			return false;
		} else {
			alertStatus.textContent = `فشل ${
				action === "setAlert" ? "تعيين" : "حذف"
			} التنبيه: ${data.message || "خطأ غير معروف."}`;
			alertStatus.style.color = "red";
			console.error("خطأ في استجابة  firebase:", data);
			return false;
		}
	} catch (error) {
		alertStatus.textContent = `حدث خطأ في الاتصال بخدمة التنبيهات: ${error.message}`;
		alertStatus.style.color = "red";
		console.error("خطأ في إرسال طلب  firebase:", error);
		return false;
	}
}
