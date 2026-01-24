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
	const newAlrtPrs = {
		id: Date.now().toString(),
		e: currentExchangeId,
		s: selectedSymbol,
		tPrc: targetPrice,
		c: alertCondition,
		f: factorPric,
		isAlrd: false,
		prc: null,
	};
	if (isBrowserAlert) newAlrtPrs.alTp = "b"; //alertType

	// التعامل مع تنبيه تيليجرام عبر firebase
	if (isTelegramAlert) {
		if (!localStorage.idChat || localStorage.idChat !== telegramChatId) {
			localStorage.setItem("idChat", telegramChatId);
			await loadUserAlertsDisplay();
			gebi("telegramChatIdNote").style.display = "none";
		}
		newAlrtPrs.tId =  telegramChatId;
		newAlrtPrs.alTp = "t"; //alertType
		const prc = currentPriceDisplay.textContent;
		if (
			(alertCondition === "l" && prc <= targetPrice) ||
			(alertCondition === "g" && prc >= targetPrice)
		) {
			newAlrtPrs.isAlrd = true;
			newAlrtPrs.prc = prc;
		}
	}
	const success = await manageAlertOnFirebase("setAlert", newAlrtPrs);
	if (success) {
		alertStatus.textContent +=
			(isTelegramAlert ? " تيليجرام" : "") +
			(isBrowserAlert ? " تطبيق " : "") +
			`تم تعيين تنبيه لـ ${selectedSymbol}.`;
		alertStatus.style.color = "green";
	}
});

async function deleteAlert(alert) {
	await manageAlertOnFirebase("dltAlrt", {
		id: alert.alertId,
		tId: alert.telegramChatId,
	});
}

// دالة لتعيين/حذف التنبيهات على  farebase
async function manageAlertOnFirebase(action, alertData = null) {
	let data = {};
	const id = alertData.id;
	alertStatus.textContent = `جاري ${
		action === "setAlert" ? "تعيين" : "حذف"
	} التنبيه...`;
	alertStatus.style.color = "#007bff";
	if (alertData.alTp === "t" || action === "dltAlrt") {
		
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
	} else data.status = "success";
	if (data.status === "success") {
		alertStatus.textContent = `${
			action === "setAlert" ? "تم تعيين" : "تم حذف"
		} التنبيه بنجاح.`;
		alertStatus.style.color = "green";
		if (action === "dltAlrt") return dltNtf(id);
		else /* if (action === "setAlert") */ {
			const alrtAdd = {
				id: id,
				e: alertData.e, // e بدلاً من exchangeId
				s: alertData.s, // s بدلاً من symbol
				tId: alertData.tId || null, // tId بدلاً من telegramChatId
				t: alertData.tPrc, // tPrc بدلاً من targetPrice
				c: alertData.c, // c بدلاً من alertCondition
				alTp: alertData.alTp, // tp بدلاً من alertType
				f: alertData.f, // f بدلاً من factorPric
				isAlrd: alertData.isAlrd,
				prc: alertData.prc ,
			};
			const alrtAddAry = ["id" + id, alrtAdd];
			alrtsStorg.push(alrtAddAry);
		} 
		localStorage.setItem("alrtsStorg", JSON.stringify(alrtsStorg));
		renderAlerts();

		if (!alertData.isAlrd && action === "setAlert") {
			await checkForBrowserAlerts(); // فحص فوري
			setTimeout(() => {
				alertStatus.textContent = "";
			}, 3000);
			return true;
		}

		setTimeout(() => {
			alertStatus.textContent = "";
			if (alertData.isAlrd) dltNtf(id);
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
