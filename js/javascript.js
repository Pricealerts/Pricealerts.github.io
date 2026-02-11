const exchangeSelect = gebi("exchangeSelect");
const currentPriceDisplay = gebi("currentPrice");
const targetPriceInput = gebi("targetPrice");
const searchPrice = gebi("searchPrice");
const dropdownList = gebi("dropdownList");
const crncDsply = gebi("crncDsply");
const cptoDsply = gebi("cptoDsply");
const alertTypeBrowserCheckbox = gebi("alertTypeBrowser"); // تم تغيير الاسم
const alertTypeTelegramCheckbox = gebi("alertTypeTelegram"); // تم تغيير الاسم
const telegramChatIdContainer = gebi("telegramChatIdContainer");
const tlgChtIdInpt = gebi("telegramChatId");
const alertStatus = gebi("alertStatus");

let telegramChatId;
let currentExchangeId = exchangeSelect.value;
let selectedSymbol = "";
let currentPrice = null;
let priceUpdateInterval;
let factorPric = 1;
let allCrpto = [];
let allCrptCmpr = [];
let symbolsMap = new Map();
let alrtsStorg = JSON.parse(localStorage.getItem("alrtsStorg")) || [];
let othExch = false;
// --- معالجات الأحداث ---

document.addEventListener("DOMContentLoaded", () => {
	startPage();
});

async function startPage() {
	//localStorage.clear()
	// --- التهيئة عند بدء التشغيل ---
	await fetchTradingPairs(currentExchangeId);
	requestNotificationPermission();

	/* if (localStorage.getItem("exchangeChoz"))
		exchangeSelect.value = localStorage.getItem("exchangeChoz"); */

	const slChId = gebi("chtIdSlct") || "";
	telegramChatId = localStorage.getItem("idChat") || "";
	const chtIdStrg = {
		ch1: localStorage.getItem("chtId1") || "",
		ch2: localStorage.getItem("chtId2") || "",
		ch3: localStorage.getItem("chtId3") || "",
	};
	const chtIdSlct = Object.values(chtIdStrg)
		.filter(Boolean)
		.map(id => `<option value="${id}">${id}</option>`)
		.join("");

	if (chtIdSlct.length) {
		slChId.style.display = "block";
		slChId.innerHTML = chtIdSlct;
		telegramChatId = chtIdStrg.ch1 || chtIdStrg.ch2 || chtIdStrg.ch3;
		tlgChtIdInpt.value = telegramChatId;
		slChId.addEventListener("change", () => {
			tlgChtIdInpt.value = slChId.value;
			telegramChatId = slChId.value;
		});
		gebi("alertsList").innerHTML =
			'<li class="no-alerts-message">جار التحميل...</li>';
		tlgChtIdInpt.style.display = "none";
	} else if (telegramChatId.length) {
		tlgChtIdInpt.value = telegramChatId;
		gebi("alertsList").innerHTML =
			'<li class="no-alerts-message">جار التحميل...</li>';
		setTimeout(() => {
			loadUserAlertsDisplay();
		}, 120000);
		//
	} else {
		tlgChtIdInpt.value = ""; // إذا لم يكن موجودًا، تأكد من مسح الحقل
		gebi("telegramChatIdNote").style.display = "block"; // إظهار الملاحظة
	}
	if (alrtsStorg.length) renderAlerts();
	// إظهار/إخفاء حقل Chat ID عند التحميل الأولي
	if (alertTypeTelegramCheckbox.checked)
		telegramChatIdContainer.style.display = "block";
	else telegramChatIdContainer.style.display = "none";

	exchangeSelect.addEventListener("change", () => {
		currentPriceDisplay.textContent = "--.--";
		currentExchangeId = exchangeSelect.value;
		searchPrice.value = "";
		fetchTradingPairs(currentExchangeId);
		alertStatus.textContent = "";
	});

	searchPrice.addEventListener("change", () => (alertStatus.textContent = ""));

	alertTypeTelegramCheckbox.addEventListener("change", () => {
		if (alertTypeTelegramCheckbox.checked)
			telegramChatIdContainer.style.display = "block";
		else telegramChatIdContainer.style.display = "none";
		alertStatus.textContent = "";
	});

	// طلب إذن الإشعارات عند اختيار تنبيه للتطبيق  "/imgs/web/icon-512.png"
	alertTypeBrowserCheckbox.addEventListener("change", () => {
		if (alertTypeBrowserCheckbox.checked) requestNotificationPermission();
		alertStatus.textContent = "";
	});
}

/*  May code */
function gebi(el) {
	return document.getElementById(el);
}

function showDropdown() {
	dropdownList.style.display = "block";
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
String.prototype.tlc = function () {
	return this.toLowerCase();
};
async function filterList() {
	const qr = searchPrice.value.tlc(); // qr = query
	if (exchangeSelect.value !== "other") {
		let filtered = allCrpto
			.filter(c => c.tlc().includes(qr))
			.sort((a, b) => a.tlc().indexOf(qr) - b.tlc().indexOf(qr));
		populateList(filtered);
		return false;
	}
	let qs = qr.trim(); //querySmbl
	if (qs.length < 2) {
		dropdownList.innerHTML = "";
		return;
	}
	qs = encodeURIComponent(qs);
	try {
		const result = await ftchFnctnAPPs({ action: "smbls", smbl: qs });
		dropdownList.innerHTML = result
			.map(
				item => `<div class="suggestion-item" onclick = "gtPrcOfOther('${item.symbol}','${item.exchDisp}')"
						><strong>${item.symbol} </strong> — ${item.shortname || item.longname || "No Name"}<span
						style="color:gray">(${item.quoteType})</span><span style="color:gray">(${item.exchDisp})</span>
                	</div>`,
			)
			.join("");
	} catch (err) {
		console.error("Search error:", err);
	}
}

function createDiv(symbol) {
	const div = document.createElement("div");
	div.textContent = symbol;
	div.onclick = () => gtPrcOfOther(symbol);
	return div;
}
function gtPrcOfOther(symbol, exch = false) {
	othExch = exch;
	searchPrice.value = symbol;
	currentPriceDisplay.textContent = "--.--"; // إعادة تعيين السعر الحالي
	dropdownList.style.display = "none";
	//crncDsply.value = currency;
	startPriceUpdates();
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
cptoDsply.addEventListener("change", () => {
	const symbol = cptoDsply.value;
	factorPric = allCrptCmpr.find(obj => obj.symbol == symbol).factor;
	let rsltFnl = currentPrice * factorPric;
	if (symbol == searchPrice.value) rsltFnl = 1;
	currentPriceDisplay.textContent = rsltFnl;
	targetPriceInput.value = rsltFnl;
});
crncDsply.addEventListener("change", async () => {
	await gtPrcCrncDsply();
});
async function gtPrcCrncDsply() {
	let priceCurrencyFtch = 1;
	let smbls = [];
	try {
		const crncFtch = currencyFtch + "USD=X";
		if (currencyFtch !== "USD") smbls.push(crncFtch); // 3omlt elsahm bnsba ldolar
		let priceNewCrncy = 1;
		const cnvrt = crncDsply.value;
		const cnvrtFtch = cnvrt + "USD=X";
		if (cnvrt !== "USD") smbls.push(cnvrtFtch); // l3omala libaghin n7wloha bnsba ldolar
		const rslt = await ftchFnctn({ action: "gtPr", smbl: smbls });
		const prc = {};
		const proms = [];
		rslt.forEach(el => {
			if (el.error) return proms.push(gtPrcCrncDsply());
			prc[el.symbol] = el;
		});
		if (proms.length) return Promise.all(proms);
		console.log(rslt);
		if (currencyFtch !== "USD") priceCurrencyFtch = prc[crncFtch].price || 1;
		if (cnvrt !== "USD") priceNewCrncy = prc[cnvrtFtch].price || 1;
		factorPric = priceCurrencyFtch / priceNewCrncy;
		const rsltFnl = currentPrice * factorPric;
		currentPriceDisplay.textContent = rsltFnl;
		targetPriceInput.value = rsltFnl;
	} catch (error) {
		console.log(error);
	}
}
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
