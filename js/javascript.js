//const { document } = require("firebase-functions/v1/firestore");

const exchangeSelect = gebi("exchangeSelect");
const currentPriceDisplay = gebi("currentPrice");
const targetPriceInput = gebi("targetPrice");
const searchPrice = gebi("searchPrice");
const dropdownList = gebi("dropdownList");
const usdDsply = gebi("usdDsply");
let allCrpto = [];
let allPrices = [];
let rfrsh = 0;
/* med email */
/* const conditionLessThanOrEqual = gebi(
	"conditionLessThanOrEqual"
);
const conditionGreaterThanOrEqual = gebi(
	"conditionGreaterThanOrEqual"
);  */
const alertTypeBrowserCheckbox = gebi("alertTypeBrowser"); // تم تغيير الاسم
const alertTypeTelegramCheckbox = gebi("alertTypeTelegram"); // تم تغيير الاسم
const telegramChatIdContainer = gebi("telegramChatIdContainer");
const telegramChatIdInput = gebi("telegramChatId");
const setAlertButton = gebi("setAlertButton");
const alertStatus = gebi("alertStatus");
const alertsList = gebi("alertsList");

let telegramChatId;
let currentExchangeId = exchangeSelect.value;
let selectedSymbol = "";
let currentPrice = null;
let priceUpdateInterval;
let activeBrowserAlerts = []; // قائمة منفصلة لتنبيهات المتصفح المحلية
// --- معالجات الأحداث ---
 startPage()
async function startPage() {
	// --- التهيئة عند بدء التشغيل ---
	await fetchTradingPairs(currentExchangeId);

	requestNotificationPermission(); // طلب إذن الإشعارات للمتصفح
	if (localStorage.getItem("exchangeChoz")) {
		exchangeSelect.value = localStorage.getItem("exchangeChoz");
	}
	if (localStorage.getItem("idChat")) {
		telegramChatIdInput.value = localStorage.getItem("idChat"); // استرجاع Chat ID من التخزين المحلي
		telegramChatId = localStorage.getItem("idChat");
		alertsList.innerHTML = '<li class="no-alerts-message">جار التحميل...</li>';
		loadUserAlertsDisplay(); // تحميل التنبيهات من الشيت للعرض
		//
	} else {
		telegramChatIdInput.value = ""; // إذا لم يكن موجودًا، تأكد من مسح الحقل
		gebi("telegramChatIdNote").style.display = "block"; // إظهار الملاحظة
	}
	// إظهار/إخفاء حقل Chat ID عند التحميل الأولي
	if (alertTypeTelegramCheckbox.checked) {
		telegramChatIdContainer.style.display = "block";
	} else {
		telegramChatIdContainer.style.display = "none";
	}

	exchangeSelect.addEventListener("change", () => {
		currentPriceDisplay.textContent = "--.--";
		currentExchangeId = exchangeSelect.value;
		searchPrice.value = "";
		fetchTradingPairs(currentExchangeId);
		alertStatus.textContent = "";
	});

	searchPrice.addEventListener("change", () => {
		startPriceUpdates();
		alertStatus.textContent = "";
	});

	// إظهار/إخفاء حقل Chat ID بناءً على اختيار تيليجرام
	alertTypeTelegramCheckbox.addEventListener("change", () => {
		if (alertTypeTelegramCheckbox.checked) {
			telegramChatIdContainer.style.display = "block";
		} else {
			telegramChatIdContainer.style.display = "none";
			telegramChatIdInput.value = ""; // مسح Chat ID إذا تم إلغاء تحديد تيليجرام
		}
		alertStatus.textContent = "";
	});

	// طلب إذن الإشعارات عند اختيار تنبيه المتصفح  "/imgs/web/icon-512.png"
	alertTypeBrowserCheckbox.addEventListener("change", () => {
		if (alertTypeBrowserCheckbox.checked) {
			requestNotificationPermission();
		}
		alertStatus.textContent = "";
	});
}

setAlertButton.addEventListener("click", async () => {
	const isTelegramAlert = alertTypeTelegramCheckbox.checked;
	const isBrowserAlert = alertTypeBrowserCheckbox.checked;

	if (!isTelegramAlert && !isBrowserAlert) {
		alertStatus.textContent =
			"الرجاء اختيار نوع واحد على الأقل من التنبيهات (تيليجرام أو المتصفح).";
		alertStatus.style.color = "red";
		return;
	}

	const targetPrice = parseFloat(targetPriceInput.value);
	const alertCondition = document.querySelector(
		'input[name="alertCondition"]:checked'
	).value;
	telegramChatId = telegramChatIdInput.value.trim();

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

	// التعامل مع تنبيه المتصفح محليًا
	if (isBrowserAlert) {
		activeBrowserAlerts.push({
			exchangeId: currentExchangeId,
			symbol: selectedSymbol,
			targetPrice: targetPrice,
			alertCondition: alertCondition,
			alertType: "browser", // هذا للحفاظ على التمييز
			status: "Active",
		});
		alertStatus.textContent = `تم تعيين تنبيه المتصفح لـ ${selectedSymbol}.`;
		alertStatus.style.color = "green";
		checkForBrowserAlerts(); // فحص فوري
	}

	// التعامل مع تنبيه تيليجرام عبر Apps Script
	if (isTelegramAlert) {
		if (localStorage.idChat !== telegramChatId) {
			localStorage.setItem("idChat", telegramChatId); // حفظ Chat ID في التخزين المحلي
		gebi('telegramChatIdNote').style.display = 'none'
		}

		// إنشاء معرف فريد للتنبيه
		const alertId = Date.now().toString();

		const newTelegramAlert = {
			id: alertId,
			exchangeId: currentExchangeId,
			symbol: selectedSymbol,
			currenci: usdDsply.value,
			targetPrice: targetPrice,
			alertCondition: alertCondition,
			alertType: "telegram", // يجب أن نرسل النوع إلى Apps Script للتخزين
			telegramChatId: telegramChatId,
			paidOrNo: false,
		};

		const success = await manageAlertOnFirebase("setAlert", newTelegramAlert);
		if (success) {
			alertStatus.textContent +=
				(isBrowserAlert ? " و" : "") +
				`تم تعيين تنبيه تيليجرام لـ ${selectedSymbol}.`;
			alertStatus.style.color = "green";
			//targetPriceInput.value = "";
			// لا نمسح telegramChatIdInput إذا تم تعيين تنبيه تيليجرام بنجاح
		}
	}

	if (!isTelegramAlert && isBrowserAlert) {
		// إذا تم تعيين تنبيه متصفح فقط
		targetPriceInput.value = "";
	}
});

async function deleteAlert(alert) {
	const success = await manageAlertOnFirebase("dltAlrt", {
		id: alert.alertId,
		telegramChatId: alert.telegramChatId,
	});
	/* if (success) {
		// loadUserAlertsDisplay() سيتم استدعاؤها في manageAlertOnFirebase عند النجاح
	} */
}

/*  May code */
function gebi(el) {
	return document.getElementById(el);
}

function showDropdown() {
	dropdownList.style.display = "block";
	/*  populateList(allCrpto); */
}

function hideDropdown() {
	setTimeout(() => {
		dropdownList.style.display = "none";
	}, 200); // Give some time for click event
}

function populateList(items) {
	dropdownList.innerHTML = "";
	items.forEach(symbol => {
		const div = createDiv(symbol);
		dropdownList.appendChild(div);
	});
}

async function filterList() {
	const query = searchPrice.value.toLowerCase();
	if (exchangeSelect.value !== "other") {
		const filtered = allCrpto.filter(c => c.toLowerCase().includes(query));
		populateList(filtered);
	} else {
		let querySmbl = query.trim();
		if (querySmbl.length < 2) {
			dropdownList.innerHTML = "";
			return;
		} else {
			querySmbl = encodeURIComponent(querySmbl);
		}
		const url = EXCHANGES.other.exchangeInfoUrl;
		try {
			const result = await ftchFnctn(url, { querySmble: querySmbl, action: "smbls" });

			dropdownList.innerHTML = result
				.map(
					item => `
                <div class="suggestion-item" onclick = "gtPrcOfOther('${
									item.symbol
								}')">
                    <strong>${item.symbol}</strong> — ${
						item.shortname || item.longname || "No Name"
					}  
                    <span style="color:gray">(${
											item.quoteType
										})</span> <span style="color:gray">(${item.exchDisp})</span>
                </div>
            `
				)
				.join("");
		} catch (err) {
			console.error("Search error:", err);
		}
	}
}

function createDiv(symbol) {
	const div = document.createElement("div");
	div.textContent = symbol;
	div.onclick = () => gtPrcOfOther(symbol);
	return div;
}
function gtPrcOfOther(symbol) {
	searchPrice.value = symbol;
	selectedSymbol = symbol;
	currentPriceDisplay.textContent = "--.--"; // إعادة تعيين السعر الحالي
	dropdownList.style.display = "none";
	//usdDsply.value = currency;
	setTimeout(() => {
		startPriceUpdates();
	}, 100);
}
// Hide dropdown when clicking outside
document.addEventListener("click", function (e) {
	if (!document.querySelector(".dropdown-container").contains(e.target)) {
		hideDropdown();
	}
});
function updateTargetPrice() {
	const targetPrice = targetPriceInput.value;
	if (targetPrice) {
		document
			.querySelectorAll(".prcTrgt")
			.forEach(el => (el.innerHTML = targetPrice));
	} else {
		document
			.querySelectorAll(".prcTrgt")
			.forEach(el => (el.innerHTML = "0.00"));
	}
}

usdDsply.addEventListener("change", async () => {
	let priceCurrencyFtch = 1;
	let url = EXCHANGES.nasdaq.exchangeInfoUrl;
	if (currencyFtch !== "USD") {
		let smbl = currencyFtch + "USD=X";
		let response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "price", querySmble: smbl }),
		});
		console.log(response);
		let rslt  = await response.json();
		
		
		priceCurrencyFtch = rslt.close;
	}

	let priceNewCrncy = 1;
	let smbl2 = usdDsply.value + "USD=X";
	let response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "price", querySmble: smbl2 }),
	});
	let rslt = await response.json();
	priceNewCrncy = rslt.close;
	currentPriceDisplay.textContent =
		(priceFtch * priceCurrencyFtch) / priceNewCrncy;
});

/* instalation app */
let deferredPrompt;

window.addEventListener("beforeinstallprompt", e => {
	e.preventDefault();
	deferredPrompt = e;
	// Update UI notify the user they can install the PWA

	gebi("dvdw").style.display = "block";
});

let buttonInstall = gebi("dvdw");
buttonInstall.addEventListener("click", async () => {
	gebi("dvdw").style.display = "none";
	deferredPrompt.prompt();
	/* if (vUp.dwAapp >0) {
        
    } */
	/* 
        const { outcome } = await deferredPrompt.userChoice;
    
        console.log(`User response to the install prompt: ${outcome}`); */
	deferredPrompt = null;
});

document.querySelectorAll(".crbtBtn").forEach(btn => {
	btn.addEventListener("click", () => {
		gebi("searchPrice").value = btn.textContent;
		filterList();
	});
});
