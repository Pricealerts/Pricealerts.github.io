setAlertButton.addEventListener("click", async () => {
	const isTelegramAlert = alertTypeTelegramCheckbox.checked;
	const isBrowserAlert = alertTypeBrowserCheckbox.checked;

	if (!isTelegramAlert && !isBrowserAlert) {
		alertStatus.textContent =
			"الرجاء اختيار نوع واحد على الأقل من التنبيهات (تيليجرام أو التطبيق).";
		alertStatus.style.color = "red";
		return;
	}
	selectedSymbol = searchPrice.value;
	const targetPrice = parseFloat(targetPriceInput.value);
	const alertCondition = document.querySelector(
		'input[name="alertCondition"]:checked',
	).value;
	telegramChatId = tlgChtIdInpt.value.trim();

	if (isNaN(targetPrice) || targetPrice <= 0) {
		alertStatus.textContent = "الرجاء إدخال سعر مستهدف صحيح.";
		alertStatus.style.color = "red";
		return;
	}
	if (!selectedSymbol || !currentExchangeId) {
		alertStatus.textContent = "الرجاء اختيار منصة وعملة.";
		alertStatus.style.color = "red";
		return;
	}

	if (isTelegramAlert && !telegramChatId) {
		alertStatus.textContent =
			"الرجاء إدخال معرّف دردشة تيليجرام لتنبيه تيليجرام.";
		alertStatus.style.color = "red";
		return;
	}

	localStorage.setItem("exchangeChoz", currentExchangeId);

	// إنشاء معرف فريد للتنبيه
	const alertId = Date.now().toString();
	// التعامل مع تنبيه للتطبيق محليًا

	const newAlrtPrs = {
		//id: alertId,
		e: currentExchangeId,
		s: selectedSymbol,
		t: targetPrice,
		c: alertCondition,
		f: factorPric,
		isAlrd: false,
	};
	if (isBrowserAlert) {
		newAlrtPrs.alTp = "b"; //alertType
		brwsrAlrts.push(["id" + alertId, newAlrtPrs]);
		alertStatus.textContent = `تم تعيين تنبيه للتطبيق لـ ${selectedSymbol}.`;
		alertStatus.style.color = "green";
		setTimeout(() => {
			alertStatus.textContent = "";
		}, 3000);
		localStorage.setItem("brwsrAlrts", JSON.stringify(brwsrAlrts));
		//renderAlNotfcation();
		checkForBrowserAlerts(); // فحص فوري
	}

	// التعامل مع تنبيه تيليجرام عبر Apps Script
	if (isTelegramAlert) {
		if (localStorage.idChat !== telegramChatId) {
			localStorage.setItem("idChat", telegramChatId); // حفظ Chat ID في التخزين المحلي
			await loadUserAlertsDisplay();
			gebi("telegramChatIdNote").style.display = "none";
		}
		newAlrtPrs.alTp = "t"; //alertType

		const prc = currentPriceDisplay.textContent;
		if (
			(alertCondition === "l" && prc <= targetPrice) ||
			(alertCondition === "g" && prc >= targetPrice)
		) {
			newAlrtPrs.isAlrd = true;
			newAlrtPrs.prc = prc;
		}
		const success = await manageAlertOnFirebase("setAlert", newAlrtPrs);
		if (success) {
			alertStatus.textContent +=
				(isBrowserAlert ? " و" : "") +
				`تم تعيين تنبيه تيليجرام لـ ${selectedSymbol}.`;
			alertStatus.style.color = "green";
			//targetPriceInput.value = "";
			// لا نمسح tlgChtIdInpt إذا تم تعيين تنبيه تيليجرام بنجاح
		}
	}

	/* if (!isTelegramAlert && isBrowserAlert) {
		// إذا تم تعيين تنبيه التطبيق فقط
		targetPriceInput.value = "";
	} */
});

async function deleteAlert(alert) {
	await manageAlertOnFirebase("dltAlrt", {
		id: alert.alertId,
		telegramChatId: alert.telegramChatId,
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
		await ftchFnctn(FIREBASE_WEB_ALERT_URL, {
			action: action,
			...alertData,
		}).then(dt => {
			data = dt;
		});
	} catch (error) {
		alertStatus.textContent = `حدث خطأ في الاتصال بخدمة التنبيهات: ${error.message}`;
		alertStatus.style.color = "red";
		console.error("خطأ في إرسال طلب  firebase:", error);
		return false;
	}

	if (data.status === "success") {
		alertStatus.textContent = `${
			action === "setAlert" ? "تم تعيين" : "تم حذف"
		} التنبيه بنجاح.`;
		alertStatus.style.color = "green";
		let strg = JSON.parse(localStorage.alrtsStorg) || {};
		const id = alertData.id;
		if (action === "setAlert") {
			const alrtAdd = {
				e: alertData.e, // e بدلاً من exchangeId
				s: alertData.s, // s بدلاً من symbol
				t: alertData.t, // t بدلاً من targetPrice
				c: alertData.c, // c بدلاً من alertCondition
			};
			const alrtAddAry = ["id" + id, alrtAdd];
			
			strg.push(alrtAddAry);
		} else {
			const alrtDlt = strg.filter(item => item[0] != id);
			strg = alrtDlt;
		}

		// تحويل المصفوفة إلى نص JSON قبل الحفظ
			console.log(strg);
		localStorage.setItem("alrtsStorg", JSON.stringify(strg));
		renderAlerts(strg);
		e;
		setTimeout(() => {
			alertStatus.textContent = "";
			if (alertData.isAlrd) {
				const alrtDlt2 = strg.filter(item => item[0] != "id" + id);
				localStorage.setItem("alrtsStorg", JSON.stringify(alrtDlt2));
				renderAlerts(alrtDlt2);
			}
		}, 3000);
		return true;
	} else if (data.status == "notPaid") {
		alertStatus.textContent =
			"انتهت صلاحية الإشتراك في النسخة المجانية عليك الإشتراك في النسخة المدفوعة لمواصلة العملية";
		alertStatus.style.color = "red";
		return false;
	} else if (data.status == "notSuccess") {
		alertStatus.textContent =
			"فشل التأكد من معرّف دردشة التيليجرام (Chat ID) الخاص بك يرجى التأكد منه وإعادة المحاولة";
		alertStatus.style.color = "red";
		console.log(data);

		return false;
	} else {
		alertStatus.textContent = `فشل ${
			action === "setAlert" ? "تعيين" : "حذف"
		} التنبيه: ${data.message || "خطأ غير معروف."}`;
		alertStatus.style.color = "red";
		console.error("خطأ في استجابة  firebase:", data);
		return false;
	}
}

/* const newTelegramAlert = {
	id: alertId,
	exchangeId: currentExchangeId,
	symbol: selectedSymbol,
	currenci: usdDsply.value,
	targetPrice: targetPrice,
	alertCondition: alertCondition,
	telegramChatId: telegramChatId,
	f: factorPric,
	isAlrd: false,
}; */
