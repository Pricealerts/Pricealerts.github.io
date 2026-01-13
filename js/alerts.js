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

function checkForBrowserAlerts() {
	if (currentPrice === null) return;
	const slrtsSmbl = brwsrAlrts.filter(alert => alert.symbol === selectedSymbol);
	slrtsSmbl.forEach( alert => {
		hndlAlrt(alert);
	});
	/* let symbolsMap = new Map();
	let aryAlrt =[];
	brwsrAlrts.forEach( alert => {
		if (!symbolsMap.has(alert.symbol)) {
			symbolsMap.set(alert.symbol, true);
			aryAlrt.push(alert);
		}
		//hndlAlrt(alert);
		currentExchangeId = alert.exchangeId;
		selectedSymbol = alert.symbol;
		//await fetchCurrentPrice(alert.exchangeId, alert.symbol);
	}); */

	function hndlAlrt(alert) {
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
			showBrowserNotification(
				alert.symbol,
				currentPrice,
				alert.targetPrice,
				alert.alertCondition
			);
			dltNtf(alert.id);
			alert.status = "Triggered"; // لمنع التنبيه المتكرر على نفس السعر
		}
	}
}


async function checkForBrowserAlerts2() { // أضفنا async هنا
    if (currentPrice === null) return;

    // معالجة تنبيهات العملة المختارة حالياً
    const slrtsSmbl = brwsrAlrts.filter(alert => alert.symbol === selectedSymbol);
    slrtsSmbl.forEach(alert => {
        hndlAlrt(alert, currentPrice); 
    });

    // معالجة كافة التنبيهات الأخرى
    for (const alert of brwsrAlrts) { // استخدام for...of بدلاً من forEach
        // تحديث البيانات مؤقتاً لجلب السعر
        let priceForThisAlert = await fetchCurrentPrice(alert.exchangeId, alert.symbol);
        
        hndlAlrt(alert, priceForThisAlert);
    }
}

async function checkForBrowserAlerts3() {
    if (brwsrAlrts.length === 0) return;

    // 1. إنشاء مصفوفة من الوعود (Promises) لجميع التنبيهات
    const promises = brwsrAlrts.map(async (alert) => {
        try {
            // جلب السعر لكل تنبيه بشكل منفصل
            const price = await fetchCurrentPrice(alert.exchangeId, alert.symbol);
            
            // التحقق من الشرط
            let shouldTrigger = false;
            if (alert.alertCondition === "l" && price <= alert.targetPrice) {
                shouldTrigger = true;
            } else if (alert.alertCondition === "g" && price >= alert.targetPrice) {
                shouldTrigger = true;
            }

            if (shouldTrigger && alert.status !== "Triggered") {
                showBrowserNotification(
                    alert.symbol,
                    price,
                    alert.targetPrice,
                    alert.alertCondition
                );
                alert.status = "Triggered";
                dltNtf(alert.id);
            }
        } catch (error) {
            console.error(`خطأ في جلب سعر ${alert.symbol}:`, error);
        }
    });

    // 2. تشغيل جميع الطلبات في وقت واحد وانتظار اكتمالها
    await Promise.all(promises);
}

// تعديل دالة hndlAlrt لتستقبل السعر كـ Parameter لضمان الدقة
function hndlAlrt(alert, priceToCheck) {
    if (!priceToCheck) return;

    let shouldTrigger = false;
    if (alert.alertCondition === "l" && priceToCheck <= alert.targetPrice) {
        shouldTrigger = true;
    } else if (alert.alertCondition === "g" && priceToCheck >= alert.targetPrice) {
        shouldTrigger = true;
    }

    if (shouldTrigger && alert.status !== "Triggered") {
        showBrowserNotification(
            alert.symbol,
            priceToCheck,
            alert.targetPrice,
            alert.alertCondition
        );
        dltNtf(alert.id);
        alert.status = "Triggered";
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
