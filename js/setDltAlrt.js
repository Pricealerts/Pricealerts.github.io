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
		'input[name="alertCondition"]:checked'
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
	if (isBrowserAlert) {
		brwsrAlrts.push({
			id: alertId,
			exchangeId: currentExchangeId,
			symbol: selectedSymbol,
			targetPrice: targetPrice,
			alertCondition: alertCondition,
			/* alertType: "browser", // هذا للحفاظ على التمييز
			status: "Active", */
		});
		alertStatus.textContent = `تم تعيين تنبيه للتطبيق لـ ${selectedSymbol}.`;
		alertStatus.style.color = "green";
		setTimeout(() => {
			alertStatus.textContent ="";
		}, 3000);
		localStorage.setItem("brwsrAlrts",JSON.stringify(brwsrAlrts));
		renderAlNotfcation();
		/* let conditionText = "";
		if (alertCondition === "l") {
			conditionText = "عندما يصبح السعر أصغر أو يساوي";
		} else if (alertCondition === "g") {
			conditionText = "عندما يصبح السعر أكبر أو يساوي";
		}
		const listItem = document.createElement("li");
		listItem.innerHTML = `
			<span class="alert-info" >
				<strong>${EXCHANGES[currentExchangeId].name} - ${selectedSymbol}</strong>
				${conditionText} ${targetPrice} 
				(النوع: تطبيق)
			</span>
			<button class="delete-button" 
			data-alert='${alertId}'
			>حذف</button>
		`;
		alertsList.appendChild(listItem); */
		checkForBrowserAlerts(); // فحص فوري
	}

	// التعامل مع تنبيه تيليجرام عبر Apps Script
	if (isTelegramAlert) {
		if (localStorage.idChat !== telegramChatId) {
			localStorage.setItem("idChat", telegramChatId); // حفظ Chat ID في التخزين المحلي
			await loadUserAlertsDisplay();
			gebi("telegramChatIdNote").style.display = "none";
		}

		const newTelegramAlert = {
			id: alertId,
			exchangeId: currentExchangeId,
			symbol: selectedSymbol,
			currenci: usdDsply.value,
			targetPrice: targetPrice,
			alertCondition: alertCondition,
			telegramChatId: telegramChatId,
			f: factorPric,
			isAlrd: false,
		};
		const prc = currentPriceDisplay.textContent;
		if (
			(alertCondition === "l" && prc <= targetPrice) ||
			(alertCondition === "g" && prc >= targetPrice)
		) {
			newTelegramAlert.isAlrd = true;
			newTelegramAlert.prc = prc;
		}
		const success = await manageAlertOnFirebase("setAlert", newTelegramAlert);
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
	const success = await manageAlertOnFirebase("dltAlrt", {
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
		let strg = JSON.parse(localStorage.alrtsStorg);
		const id = alertData.id;
		if (action === "setAlert") {
			const alrtAdd = {
				e: alertData.exchangeId, // e بدلاً من exchangeId
				s: alertData.symbol, // s بدلاً من symbol
				t: alertData.targetPrice, // t بدلاً من targetPrice
				c: alertData.alertCondition, // c بدلاً من alertCondition
			};
			const alrtAddAry = ["id" + id, alrtAdd];
			strg.push(alrtAddAry);
		} else {
			const alrtDlt = strg.filter(item => item[0] != id);
			strg = alrtDlt;
		}

		// تحويل المصفوفة إلى نص JSON قبل الحفظ
		localStorage.setItem("alrtsStorg", JSON.stringify(strg));
		renderAlerts(strg);

		setTimeout(() => {
			alertStatus.textContent = "";
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

const arry1 = ["dadidi", "oussama"];
const arr2 = ["sali", "yassin", ...arry1];
//atarr2.push(arry1)
console.log(arr2);
