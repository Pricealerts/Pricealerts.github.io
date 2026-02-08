// --- وظائف مساعدة ---

//import { set } from "../firebaseCode";

async function loadUserAlertsDisplay() {
	try {
		/* const rslt = await ftchFnctn(FIREBASE_WEB_ALERT_URL, {
			action: "gtAlerts",
			chid: telegramChatId,
		}); */
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
	const alerts = alrtsStorg;
	const brwAlrts = alerts.filter(alert => alert[1].alTp === "b");
	const tlgAlrts = alerts.filter(alert => alert[1].alTp !== "t");
	gebi("alertsListNtf").innerHTML =
		!brwAlrts.length 
			? '<li class="no-alerts-message">لا توجد تنبيهات نشطة حاليًا.</li>'
			: "";

	gebi("alertsList").innerHTML =
		!tlgAlrts.length 
			? '<li class="no-alerts-message">لا توجد تنبيهات نشطة حاليًا.</li>'
			: "";
	let alrtlst = gebi("alertsListNtf");
	alerts.forEach(alert => {
		console.log(alert);

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
			dltAlrt =`deleteAlert(${JSON.stringify({
				alertId: alert[0],
				telegramChatId: "cht" + telegramChatId,
			})})` ;
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
	if (alrtsStorg.length === 0) return;
	//await hndlAlrt(currentPrice, selectedSymbol);
	//let symbolsMap = new Map();
	let symbolsMap = [
		...new Set(alrtsStorg.map(([, alert]) => ({ e: alert.e, s: alert.s }))),
	];

	const alertPromises = symbolsMap.map(async item => {
		//	if(item.e == ["binanace","mexc"])return; // تخطي هذه المنصات
		try {
			const price = await fetchCurrentPrice(
				item.e, // المنصة
				item.s, // الرمز
				false,
				true,
			);
			if (price) {
				await hndlAlrt(price, item.s);
			}
		} catch (error) {
			console.error(`خطأ في جلب سعر ${item.s}:`, error);
		}
	});
	await Promise.all(alertPromises);
}
async function checkForBrowserAlerts2() {
	if (alrtsStorg.length === 0) return;
	await hndlAlrt(currentPrice, selectedSymbol);
	// 1. فلترة العملات الفريدة لتقليل عدد طلبات الـ API
	let symbolsMap = new Map();
	//	let uniqueAlerts = [...new Set(alrtsStorg.map(alert => alert[1].s))].map(s => alrtsStorg.find(a => a[1].s === s));

	const aryAlrts = alrtsStorg.map(alert => {
		if (!symbolsMap.has(alert[1].s)) {
			symbolsMap.set(alert[1].s, alert[1].e);
		}
		alert[1].id = alert[0]; // إضافة معرف التنبيه للكائن
		return alert[1];
	});

	// 2. إنشاء الوعود ومعالجتها بشكل متوازي
	const alertPromises = symbolsMap.map(async uniqueAlert => {
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
				await hndlAlrt(price, uniqueAlert.s);
			}
		} catch (error) {
			console.error(`خطأ في جلب سعر ${uniqueAlert.s}:`, error);
		}
	});

	// الانتظار حتى تنتهي جميع عمليات جلب الأسعار
	await Promise.all(alertPromises);
}

// دالة المعالجة الداخلية
async function hndlAlrt(curentPrice, slctdSmbl) {
	const alertsForThisSymbol = alrtsStorg.filter(([, a]) => a.s === slctdSmbl);
	const proms = [];
	alertsForThisSymbol.forEach(async alerte => {
		const alert = alerte[1];
		const id = alerte[0];
		if (
			(alert.c === "l" && curentPrice <= alert.t) ||
			(alert.c === "g" && curentPrice >= alert.t)
		) {
			if (alert.alTp === "t")
				proms.push(
					await deleteAlert({
						id: id,
						telegramChatId: "cht" + telegramChatId,
					}),
				);
			else showBrowserNotification(alert.s, curentPrice, alert.t, alert.c);
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




