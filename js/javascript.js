const exchangeSelect = gebi("exchangeSelect");
const currentPriceDisplay = gebi("currentPrice");
const targetPriceInput = gebi("targetPrice");
const searchPrice = gebi("searchPrice");
const dropdownList = gebi("dropdownList");
let allCrpto = [];

/* med email */
/* const conditionLessThanOrEqual = gebi(
	"conditionLessThanOrEqual"
);
const conditionGreaterThanOrEqual = gebi(
	"conditionGreaterThanOrEqual"
);  */

const alertTypeBrowserCheckbox = gebi("alertTypeBrowser"); // تم تغيير الاسم
const alertTypeTelegramCheckbox = gebi("alertTypeTelegram"); // تم تغيير الاسم
const telegramChatIdContainer = gebi(
	"telegramChatIdContainer"
);
const telegramChatIdInput = gebi("telegramChatId");
const setAlertButton = gebi("setAlertButton");
const alertStatus = gebi("alertStatus");
const alertsList = gebi("alertsList");

// *** استبدل هذا برابط Web app URL الخاص بـ Google Apps Script الذي ستنشئه ***
let getPriceUrl = 'https://script.google.com/macros/s/AKfycbyg0QZ6udY-A2E8r_Q5rwr46HKUgFxV2h1MvKW1xJtYBBx2OJAmQo5zBM_fYsGhjvU6/exec';
const APPS_SCRIPT_WEB_APP_URL =
	"https://script.google.com/macros/s/AKfycbz0hE-JXd26WjQtLOwp3SZI5_x5ZETBZjWPxFutRyZiPMDn01khIam6tVxBanNl-O2s/exec";

const MAX_ALERTS = 5; // يمكن تغيير هذا الحد الأقصى للتنبيهات

// تعريف جميع المنصات المدعومة وواجهات برمجة التطبيقات الخاصة بها
const EXCHANGES = {
	binance: {
		name: "Binance",
		exchangeInfoUrl: "https://api.binance.com/api/v3/exchangeInfo",
		tickerPriceUrl: "https://api.binance.com/api/v3/ticker/price",
		usdtSuffix: "USDT",
		intervalData: 5000,
	},
	kucoin: {
		name: "KuCoin",
		exchangeInfoUrl: "https://api.kucoin.com/api/v1/symbols",
		tickerPriceUrl: "https://api.kucoin.com/api/v1/market/orderbook/level1",
		usdtSuffix: "USDT",
		intervalData: 60000,
	},
	coingecko: {
		name: "CoinGecko",
		exchangeInfoUrl: "https://api.coingecko.com/api/v3/coins/list", // لأسواق Spot
		tickerPriceUrl: "https://api.coingecko.com/api/v3/simple/price", // لجلب أسعار Ticker لأسواق Spot
		usdtSuffix: "USDT",
		intervalData: 60000,
	},
	okx: {
		name: "OKX",
		exchangeInfoUrl:
			"https://www.okx.com/api/v5/public/instruments?instType=SPOT",
		tickerPriceUrl: "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
		usdtSuffix: "-USDT", // لاحظ التنسيق المختلف للرمز في OKX
		intervalData: 5000,
	},
};

let currentExchangeId = exchangeSelect.value;
let selectedSymbol = "";
let currentPrice = null;
let priceUpdateInterval;
let activeBrowserAlerts = []; // قائمة منفصلة لتنبيهات المتصفح المحلية

// --- وظائف مساعدة ---

async function loadUserAlertsDisplay() {
	const apScrptAndId =
		APPS_SCRIPT_WEB_APP_URL +
		"?action=getId&idChat=" +
		telegramChatIdInput.value;
	try {
		const res = await fetch(apScrptAndId)
			.then(res => res.json())
			.then(rslt => {
				renderAlerts(rslt.alerts);
			});
	} catch (err) {
		console.error("خطأ في تحميل التنبيهات:", err.message);
		const alertsList = gebi("alertsList");
		alertsList.innerHTML =
			'<li class="no-alerts-message" style="color:red;">خطأ في تحميل التنبيهات.</li>';
	}
}

function renderAlerts(alerts) {
	const alertsList = gebi("alertsList");
	alertsList.innerHTML = "";

	if (!alerts || alerts.length === 0) {
		alertsList.innerHTML = "<li>لا توجد تنبيهات حالياً.</li>";
		return;
	}

	alerts.forEach(alert => {
		const li = document.createElement("li");
		li.textContent = `${alert.symbol} - ${alert.price} (${alert.condition})`;
		alertsList.appendChild(li);
	});
}

function renderAlerts(alerts) {
	alertsList.innerHTML = "";
	if (!alerts || alerts.length === 0) {
		alertsList.innerHTML =
			'<li class="no-alerts-message">لا توجد تنبيهات نشطة حاليًا.</li>';
		return;
	}

	alerts.forEach(alert => {
		let conditionText = "";
		if (alert.alertCondition === "less_than_or_equal") {
			conditionText = "عندما يصبح السعر أصغر أو يساوي";
		} else if (alert.alertCondition === "greater_than_or_equal") {
			conditionText = "عندما يصبح السعر أكبر أو يساوي";
		}

		const listItem = document.createElement("li");
		listItem.innerHTML = `
			<span class="alert-info">
				<strong>${EXCHANGES[alert.exchangeId].name} - ${alert.symbol}</strong>
				${conditionText} ${alert.targetPrice} USDT
				(النوع: تيليجرام)
				<br>المعرف: ${alert.telegramChatId}
			</span>
			<button class="delete-button" data-alert-id="${alert.id}">حذف</button>
		`;
		alertsList.appendChild(listItem);
	});

	document.querySelectorAll(".delete-button").forEach(button => {
		button.addEventListener("click", event => {
			const alertIdToDelete = event.target.dataset.alertId;
			deleteAlert(alertIdToDelete);
		});
	});
}

// --- وظائف جلب البيانات وتحديث الأسعار ---

async function fetchTradingPairs(exchangeId) {
	const exchange = EXCHANGES[exchangeId];
	if (!exchange) {
		currentPriceDisplay.textContent = "منصة غير متاحة.";
		searchPrice.placeholder = "الرجاء اختيار منصة صحيحة";
		return;
	}

	try {
		let symbols = [];
		let urlCrpts =
			getPriceUrl +
			"?action=getCryptoSymbols&urlSmbls=" +
			exchange.exchangeInfoUrl;
		let response, data;

		switch (exchangeId) {
			case "binance":
				response = await fetch(exchange.exchangeInfoUrl);
				data = await response.json();
				symbols = data.symbols
					.filter(
						s =>
							s.symbol.endsWith(exchange.usdtSuffix) && s.status === "TRADING"
					)
					.map(s => s.symbol);
				break;
			case "kucoin":
				response = await fetch(urlCrpts);
				data = await response.json();
				if (data.code == "200000" && data.data) {
					symbols = data.data
						.filter(
							s => s.symbol.endsWith(exchange.usdtSuffix) && s.enableTrading
						)
						.map(s => s.symbol);
				} else {
					console.error("حدث خطأ في البيانات:", data);
				}
				break;
			case "coingecko":
				response = await fetch(exchange.exchangeInfoUrl);
				data = await response.json();

				// تحويل النتائج إلى أسماء العملات (id) فقط — مثلاً التي تنتهي بـ "usd"
				symbols = data
					.filter(s => s.id && s.symbol) // فقط العملات التي لها id و رمز
					.map(s => s.id); // يمكن أيضًا فلترة لاحقًا حسب الشرط الذي تريده
				break;
			case "okx":
				response = await fetch(exchange.exchangeInfoUrl);
				data = await response.json();
				if (data.code === "0" && data.data) {
					symbols = data.data
						.filter(
							s =>
								s.instType === "SPOT" &&
								s.quoteCcy === exchange.usdtSuffix.replace("-", "") &&
								s.state === "live"
						)
						.map(s => s.instId);
				} else {
					console.error(
						`خطأ من OKX API (exchangeInfo):`,
						data.msg || JSON.stringify(data)
					);
				}
				break;
			default:
				console.error("منصة غير مدعومة:", exchangeId);
				break;
		}

		dropdownList.innerHTML = "";
		if (symbols.length > 0) {
			symbols.sort();
			allCrpto = symbols; // حفظ جميع العملات في متغير عام

			symbols.forEach(symbol => {
				const div = createDiv(symbol);
				dropdownList.appendChild(div);
			});
			selectedSymbol = symbols[0];
			searchPrice.value = selectedSymbol;

			startPriceUpdates();
		} else {
			searchPrice.placeholder = "لا توجد أزواج  متاحة، الرجاء اختيار منصة أخرى";
			if (priceUpdateInterval) clearInterval(priceUpdateInterval);
		}
	} catch (error) {
		//console.error(`حدث خطأ في جلب أزواج العملات من ${exchange.name}:`, error);
		currentPriceDisplay.textContent = "خطأ في التحميل.";
		searchPrice.placeholder = "خطأ في التحميل";
		if (priceUpdateInterval) clearInterval(priceUpdateInterval);
	}
}

async function fetchCurrentPrice(exchangeId, symbol ,isPriceUpdate = false)  {
	const exchange = EXCHANGES[exchangeId];
	if (!exchange) return null;

	try {
		let urlCrpts =
			getPriceUrl +
			"?action=getPrice&urlSmbl=" +
			exchange.tickerPriceUrl;
		let apiUrl = "";
		let price = null;
		let response, data;

		switch (exchangeId) {
			case "binance":
				apiUrl = `${exchange.tickerPriceUrl}?symbol=${symbol}`;
				response = await fetch(apiUrl);
				data = await response.json();
				if (data && data.price) {
					price = parseFloat(data.price);
				}
				break;
			case "kucoin":
				apiUrl = `${urlCrpts}&symbole=${symbol}`;
				response = await fetch(apiUrl);
				data = await response.json();
				
				// إذا كانت البيانات تحتوي على رمز السعر
				if (data.code === "200000" && data.data && data.data.price) {
					price = parseFloat(data.data.price);
				} else {
					console.error(
						`خطأ من KuCoin API (ticker):`,
						data.msg || JSON.stringify(data)
					);
				}
				break;
			case "coingecko":
				apiUrl = `${exchange.tickerPriceUrl}?ids=${symbol}&vs_currencies=usd`;
				response = await fetch(apiUrl).then(res => res.json());
				data = response;
				price = data[symbol].usd;
				break;
			case "okx":
				apiUrl = `${exchange.tickerPriceUrl}&instId=${symbol}`;
				response = await fetch(apiUrl);
				data = await response.json();
				if (
					data.code === "0" &&
					data.data &&
					data.data.length > 0 &&
					data.data[0].last
				) {
					price = parseFloat(data.data[0].last);
				} else {
					console.error(
						`خطأ من OKX API (ticker):`,
						data.msg || JSON.stringify(data)
					);
				}
				break;
			default:
				console.error("منصة غير مدعومة لجلب السعر:", exchangeId);
				break;
		}

		if (price !== null) {
			currentPrice = price;
			currentPriceDisplay.textContent = `${currentPrice} USDT`;
			if (isPriceUpdate) {
				targetPriceInput.value = currentPrice; // تعيين السعر الحالي كقيمة افتراضية لحقل السعر المستهدف
				document.querySelectorAll(".prcTrgt").forEach(el => el.innerHTML = currentPrice);
			}
			checkForBrowserAlerts(); // فحص تنبيهات المتصفح عند تحديث السعر
			return currentPrice;
		} else {
			currentPriceDisplay.textContent = "السعر غير متاح.";
			currentPrice = null;
			return null;
		}
	} catch (error) {
		console.error(`حدث خطأ في جلب سعر ${symbol} من ${exchange.name}:`, error);
		currentPriceDisplay.textContent = "خطأ في جلب السعر.";
		currentPrice = null;
		return null;
	}
}

function startPriceUpdates() {
	if (priceUpdateInterval) {
		clearInterval(priceUpdateInterval);
	}
	if (selectedSymbol && currentExchangeId) {
		fetchCurrentPrice(currentExchangeId, selectedSymbol, true); // جلب السعر الحالي عند بدء التحديثات
		priceUpdateInterval = setInterval(
			() => fetchCurrentPrice(currentExchangeId, selectedSymbol),
			EXCHANGES[currentExchangeId].intervalData
		);
	} else {
		currentPriceDisplay.textContent = "--.-- USDT";
		currentPrice = null;
	}
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
			body: `وصل السعر إلى ${price} USDT. ${conditionText}`,//https://www.google.com/s2/favicons?domain=binance.com
			icon: "../imgs/apple-touch-icon.png", // يمكنك تغيير الأيقونة حسب المنصة
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
					currentPrice >= alert.targetPrice
				) {
					shouldTrigger = true;
				} else if (
					alert.alertCondition === "greater_than_or_equal" &&
					currentPrice <= alert.targetPrice
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
// دالة لتعيين/حذف التنبيهات على Apps Script
async function manageAlertOnAppsScript(action, alertData = null) {
	let data = {};
	alertStatus.textContent = `جاري ${
		action === "setAlert" ? "تعيين" : "حذف"
	} التنبيه...`;
	alertStatus.style.color = "#007bff";

	try {
		const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
			method: "POST" /* 
			headers: {
				'Content-Type': 'application/json',
			}, */,
			body: JSON.stringify({
				action: action,
				...alertData,
			}),
		})
			.then(res => res.json())
			.then(dt => {
				data = dt;
			});

		if (data.status === "success") {
			
			alertStatus.textContent = `${
				action === "setAlert" ? "تم تعيين" : "تم حذف"
			} التنبيه بنجاح.`;
			alertStatus.style.color = "green";
			loadUserAlertsDisplay(); // تحديث قائمة التنبيهات بعد كل عملية
			setTimeout(() => {alertStatus.textContent = '' }, 3000);
			return true;
		} else {
			alertStatus.textContent = `فشل ${
				action === "setAlert" ? "تعيين" : "حذف"
			} التنبيه: ${data.message || "خطأ غير معروف."}`;
			alertStatus.style.color = "red";
			console.error("خطأ في استجابة Apps Script:", data);
			return false;
		}
	} catch (error) {
		alertStatus.textContent = `حدث خطأ في الاتصال بخدمة التنبيهات: ${error.message}`;
		alertStatus.style.color = "red";
		console.error("خطأ في إرسال طلب Apps Script:", error);
		return false;
	}
}

// --- معالجات الأحداث ---

exchangeSelect.addEventListener("change", () => {
	currentExchangeId = exchangeSelect.value;
	fetchTradingPairs(currentExchangeId);
	alertStatus.textContent = "";
});

/* searchPrice.addEventListener("change", () => {
	selectedSymbol = searchPrice.value;
	startPriceUpdates();
	alertStatus.textContent = "";
}); */

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

// طلب إذن الإشعارات عند اختيار تنبيه المتصفح
alertTypeBrowserCheckbox.addEventListener("change", () => {
	if (alertTypeBrowserCheckbox.checked) {
		requestNotificationPermission();
	}
	alertStatus.textContent = "";
});

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
	let telegramChatId = telegramChatIdInput.value.trim();

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
		// التحقق من العدد الأقصى لتنبيهات تيليجرام المخزنة في Apps Script
		// هذا يتطلب جلب التنبيهات مرة أخرى من Apps Script أو تتبعها محليًا بدقة
		// للتبسيط، سنعتمد على أن Apps Script سيتعامل مع هذا الحد.
		// لكي يكون هذا التحقق دقيقًا هنا، يجب أن نجلب activeAlerts من Apps Script أولاً
		// (أو يمكن أن يتم التحكم في هذا الحد على جانب Apps Script فقط).
		// حاليًا، هذا الحد يتعلق فقط بما يتم عرضه في الواجهة الأمامية وليس العدد الفعلي في الشيت
		// (لأن AlertsList يعرض فقط تنبيهات تيليجرام النشطة).
		if (localStorage.idChat !== telegramChatId) {
			localStorage.setItem("idChat", telegramChatId); // حفظ Chat ID في التخزين المحلي
		}
		
		// إنشاء معرف فريد للتنبيه
		const alertId = Date.now().toString();

		const newTelegramAlert = {
			id: alertId,
			exchangeId: currentExchangeId,
			symbol: selectedSymbol,
			targetPrice: targetPrice,
			alertCondition: alertCondition,
			alertType: "telegram", // يجب أن نرسل النوع إلى Apps Script للتخزين
			telegramChatId: telegramChatId,
		};

		const success = await manageAlertOnAppsScript("setAlert", newTelegramAlert);
		if (success) {
			alertStatus.textContent +=
				(isBrowserAlert ? " و" : "") +
				`تم تعيين تنبيه تيليجرام لـ ${selectedSymbol}.`;
			alertStatus.style.color = "green";
			targetPriceInput.value = "";
			// لا نمسح telegramChatIdInput إذا تم تعيين تنبيه تيليجرام بنجاح
		} else {
			// إذا فشل تنبيه تيليجرام، قد لا نرغب في مسح حقل Chat ID
		}
	}

	if (!isTelegramAlert && isBrowserAlert) {
		// إذا تم تعيين تنبيه متصفح فقط
		targetPriceInput.value = "";
	}
});

async function deleteAlert(alertId) {
	const success = await manageAlertOnAppsScript("deleteAlert", {
		id: alertId,
	});
	if (success) {
		// loadUserAlertsDisplay() سيتم استدعاؤها في manageAlertOnAppsScript عند النجاح
	}
}

// --- التهيئة عند بدء التشغيل ---
fetchTradingPairs(currentExchangeId);

requestNotificationPermission(); // طلب إذن الإشعارات للمتصفح

if (localStorage.getItem("idChat")) {
	telegramChatIdInput.value = localStorage.getItem("idChat"); // استرجاع Chat ID من التخزين المحلي
	loadUserAlertsDisplay(); // تحميل التنبيهات من الشيت للعرض
}else {
	telegramChatIdInput.value = ""; // إذا لم يكن موجودًا، تأكد من مسح الحقل
	gebi("telegramChatIdNote").style.display = "block"; // إظهار الملاحظة
}
// إظهار/إخفاء حقل Chat ID عند التحميل الأولي
if (alertTypeTelegramCheckbox.checked) {
	telegramChatIdContainer.style.display = "block";
} else {
	telegramChatIdContainer.style.display = "none";
}




/*  May code */
function gebi(el){return document.getElementById(el)}

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

function filterList() {
	const query = searchPrice.value.toLowerCase();
	const filtered = allCrpto.filter(c => c.toLowerCase().includes(query));
	populateList(filtered);
}

// Hide dropdown when clicking outside
document.addEventListener("click", function (e) {
	if (!document.querySelector(".dropdown-container").contains(e.target)) {
		hideDropdown();
	}
});

 function createDiv(symbol) {
	const div = document.createElement("div");
	div.textContent = symbol;
	div.onclick =  () => {
		searchPrice.value = symbol;
		selectedSymbol = symbol;
		currentPriceDisplay.textContent = "--.-- USDT"; // إعادة تعيين السعر الحالي
		dropdownList.style.display = "none";
		startPriceUpdates();
	};
	return div;
}
function updateTargetPrice() {
	const targetPrice = targetPriceInput.value;
	if (targetPrice ) {
		document.querySelectorAll(".prcTrgt").forEach(el => el.innerHTML = targetPrice);
	} else {
		document.querySelectorAll(".prcTrgt").forEach(el => el.innerHTML = "0.00");
	}
}

  
/* instalation app */
let deferredPrompt;
/* if app is instal */
/* window.addEventListener('appinstalled', () => {
    // Hide the app-provided install promotion
    gebi('dvdw').style.display = 'none';
    // Clear the deferredPrompt so it can be garbage collected
    deferredPrompt = null; 

  }); */

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
	
    // Update UI notify the user they can install the PWA

    gebi('dvdw').style.display = 'block';

    /* let os = navigator.userAgent.toLocaleLowerCase();
	if (os.includes('android') || os.includes('ipad') || os.includes('iphone')) {
        gebi('dvdw').style.display = 'block';
    } */

});

let buttonInstall = gebi('dvdw');
buttonInstall.addEventListener('click', async () => {
    gebi('dvdw').style.display = 'none';
    deferredPrompt.prompt();
    /* if (vUp.dwAapp >0) {
        
    } */
    /* 
        const { outcome } = await deferredPrompt.userChoice;
    
        console.log(`User response to the install prompt: ${outcome}`); */
    deferredPrompt = null;
});
