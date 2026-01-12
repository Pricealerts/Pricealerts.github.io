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
const tlgChtIdInpt = gebi("telegramChatId");
const setAlertButton = gebi("setAlertButton");
const alertStatus = gebi("alertStatus");
const alertsList = gebi("alertsList");

let telegramChatId;
let currentExchangeId = exchangeSelect.value;
let selectedSymbol = "";
let currentPrice = null;
let priceUpdateInterval;
let activeBrowserAlerts = []; // قائمة منفصلة لتنبيهات للتطبيق المحلية
let factorPric = 1;
// --- معالجات الأحداث ---

document.addEventListener("DOMContentLoaded", () => {
	startPage();
});

async function startPage() {
	// --- التهيئة عند بدء التشغيل ---
	await fetchTradingPairs(currentExchangeId);

	requestNotificationPermission(); // طلب إذن الإشعارات للتطبق
	if (localStorage.getItem("exchangeChoz")) {
		exchangeSelect.value = localStorage.getItem("exchangeChoz");
	}
	let chtIdSlct = "";
	const slChId = gebi("chtIdSlct");
	const chtIdStrg = {
		ch1: localStorage.getItem("chtId1") || "",
		ch2: localStorage.getItem("chtId2") || "",
		ch3: localStorage.getItem("chtId3") || "",
	};
	if (chtIdStrg.ch1.length > 0)
		chtIdSlct += `<option value="${chtIdStrg.ch1}">${chtIdStrg.ch1}</option>`;
	if (chtIdStrg.ch2.length > 0)
		chtIdSlct += `<option value="${chtIdStrg.ch2}">${chtIdStrg.ch2}</option>`;
	if (chtIdStrg.ch3.length > 0)
		chtIdSlct += `<option value="${chtIdStrg.ch3}">${chtIdStrg.ch3}</option>`;

	if (chtIdSlct.length > 0) {
		slChId.style.display = "block";
		slChId.innerHTML = chtIdSlct;
		slChId.addEventListener("change", () => {
			tlgChtIdInpt.value = slChId.value;
			telegramChatId = slChId.value;
		});
		tlgChtIdInpt.style.display = "none";
		await loadUserAlertsDisplay();
	} else if (localStorage.getItem("idChat")) {
		tlgChtIdInpt.value = localStorage.getItem("idChat"); // استرجاع Chat ID من التخزين المحلي
		telegramChatId = localStorage.getItem("idChat");
		alertsList.innerHTML = '<li class="no-alerts-message">جار التحميل...</li>';
		await loadUserAlertsDisplay();
		//
	} else {
		tlgChtIdInpt.value = ""; // إذا لم يكن موجودًا، تأكد من مسح الحقل
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
			tlgChtIdInpt.value = ""; // مسح Chat ID إذا تم إلغاء تحديد تيليجرام
		}
		alertStatus.textContent = "";
	});

	// طلب إذن الإشعارات عند اختيار تنبيه للتطبيق  "/imgs/web/icon-512.png"
	alertTypeBrowserCheckbox.addEventListener("change", () => {
		if (alertTypeBrowserCheckbox.checked) {
			requestNotificationPermission();
		}
		alertStatus.textContent = "";
	});
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
			const result = await ftchFnctn(url, {
				querySmble: querySmbl,
				action: "smbls",
			});
			dropdownList.innerHTML = result
				.map(
					item => `
                <div class="suggestion-item" onclick = "gtPrcOfOther('${
									item.symbol
								}')">
                    <strong>${item.symbol}</strong> — ${
						item.shortname || item.longname || "No Name"
					}  
                    <span style="color:gray">(
					${item.quoteType}
					)</span> <span style="color:gray">(${item.exchDisp})</span>
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

	const url = EXCHANGES.nasdaq.exchangeInfoUrl;
	if (currencyFtch !== "USD") {
		const smbl = currencyFtch + "USD=X"; // 3omlt elsahm bnsba ldolar
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "price", querySmble: smbl }),
		});
		console.log(response);
		const rslt = await response.json();

		priceCurrencyFtch = rslt.close || 1;
	}

	let priceNewCrncy = 1;
	const cnvrt = usdDsply.value;
	if (cnvrt !== "USD") {
		const smbl2 = cnvrt + "USD=X"; // l3omala libaghin n7wloha bnsba ldolar
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "price", querySmble: smbl2 }),
		});

		const rslt = await response.json();
		priceNewCrncy = rslt.close || 1;
	}

	factorPric = priceCurrencyFtch / priceNewCrncy;
	const rsltFnl = currentPrice * factorPric;
	currentPriceDisplay.textContent = rsltFnl;
	targetPriceInput.value = rsltFnl;
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
	/* if (vUp.dwAapp >0) {} 
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
