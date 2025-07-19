document.addEventListener("DOMContentLoaded", () => {
	const exchangeSelect = document.getElementById("exchangeSelect");
	const currencySelect = document.getElementById("currencySelect");
	const currentPriceDisplay = document.getElementById("currentPrice");
	const targetPriceInput = document.getElementById("targetPrice");

	const conditionLessThanOrEqual = document.getElementById(
		"conditionLessThanOrEqual"
	);
	const conditionGreaterThanOrEqual = document.getElementById(
		"conditionGreaterThanOrEqual"
	);

	const alertTypeBrowserCheckbox = document.getElementById("alertTypeBrowser"); // تم تغيير الاسم
	const alertTypeTelegramCheckbox =
		document.getElementById("alertTypeTelegram"); // تم تغيير الاسم
	const telegramChatIdContainer = document.getElementById(
		"telegramChatIdContainer"
	);
	const telegramChatIdInput = document.getElementById("telegramChatId");
	const setAlertButton = document.getElementById("setAlertButton");
	const alertStatus = document.getElementById("alertStatus");
	const alertsList = document.getElementById("alertsList");

	// *** استبدل هذا برابط Web app URL الخاص بـ Google Apps Script الذي ستنشئه ***
	const APPS_SCRIPT_WEB_APP_URL =
		"https://script.google.com/macros/s/AKfycbxc9Hk-vv-jJIZFzdAHUBwTxK2eNR44AnM2ExFPQGb8TrqSCyTxLpCeFC4LJ19v7hyf/exec";

	const MAX_ALERTS = 5; // يمكن تغيير هذا الحد الأقصى للتنبيهات

	// تعريف جميع المنصات المدعومة وواجهات برمجة التطبيقات الخاصة بها
	const EXCHANGES = {
		binance: {
			name: "Binance",
			exchangeInfoUrl: "https://api.binance.com/api/v3/exchangeInfo",
			tickerPriceUrl: "https://api.binance.com/api/v3/ticker/price",
			usdtSuffix: "USDT",
		},
		kucoin: {
			name: "KuCoin",
			exchangeInfoUrl: "https://api.kucoin.com/api/v1/exchangeInfo",
			tickerPriceUrl: "https://api.kucoin.com/api/v1/market/orderbook/level1",
			usdtSuffix: "USDT",
		},
		bybit: {
			name: "Bybit",
			exchangeInfoUrl: "https://api.bybit.com/v2/public/symbols", // لأسواق Spot
			tickerPriceUrl: "https://api.bybit.com/v2/public/tickers", // لجلب أسعار Ticker لأسواق Spot
			usdtSuffix: "USDT",
		},
		okx: {
			name: "OKX",
			exchangeInfoUrl:
				"https://www.okx.com/api/v5/public/instruments?instType=SPOT",
			tickerPriceUrl: "https://www.okx.com/api/v5/market/tickers?instType=SPOT",
			usdtSuffix: "-USDT", // لاحظ التنسيق المختلف للرمز في OKX
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
			APPS_SCRIPT_WEB_APP_URL + "?idChat=" + telegramChatIdInput.value;
		try {
			const res = await fetch(apScrptAndId)
				.then(res => res.json())
				.then(rslt => {
					renderAlerts(rslt.alerts);
				});
		} catch (err) {
			console.error("خطأ في تحميل التنبيهات:", err.message);
			const alertsList = document.getElementById("alertsList");
			alertsList.innerHTML =
				'<li class="no-alerts-message" style="color:red;">خطأ في تحميل التنبيهات.</li>';
		}
	}

	function renderAlerts(alerts) {
		const alertsList = document.getElementById("alertsList");
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
				conditionText = "عندما يصبح السعر ≤";
			} else if (alert.alertCondition === "greater_than_or_equal") {
				conditionText = "عندما يصبح السعر ≥";
			}

			const listItem = document.createElement("li");
			listItem.innerHTML = `
                <span class="alert-info">
                    <strong>${EXCHANGES[alert.exchangeId].name} - ${
				alert.symbol
			}</strong>
                    ${conditionText} ${alert.targetPrice} USDT
                    (النوع: تيليجرام)
                    <br>المعرف: ${alert.telegramChatId}
                </span>
                <button class="delete-button" data-alert-id="${
									alert.id
								}">حذف</button>
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
			currencySelect.innerHTML =
				'<option value="">الرجاء اختيار منصة صحيحة</option>';
			return;
		}

		try {
			let symbols = [];
			let response, data;
			switch (exchangeId) {
				case "binance":
					response = await fetch(exchange.exchangeInfoUrl)
						.then(rslt => rslt.json())
						.then(res => {
							data = res;
						});
					symbols = data.symbols
						.filter(
							s =>
								s.symbol.endsWith(exchange.usdtSuffix) && s.status === "TRADING"
						)
						.map(s => s.symbol);
					break;
				case "kucoin":
					response = await fetch("https://api.kucoin.com/api/v1/symbols");
					data = await response.json();

					if (data.code == "200000" && data.data) {
						const symbols = data.data
							.filter(
								s => s.symbol.endsWith(exchange.usdtSuffix) && s.enableTrading
							)
							.map(s => s.symbol);

						console.log("Symbols:", symbols);
					} else {
						console.error("حدث خطأ في البيانات:", data);
					}
					break;
				case "bybit":
					response = await fetch(exchange.exchangeInfoUrl)
						.then(rslt => rslt.json())
						.then(res => {
							data = res;
						});
					if (data.ret_code === 0 && data.result) {
						symbols = data.result
							.filter(
								s =>
									s.quote_currency === exchange.usdtSuffix &&
									s.status === "Trading"
							)
							.map(s => s.base_currency + exchange.usdtSuffix);
					} else {
						console.error(
							`خطأ من Bybit API (exchangeInfo):`,
							data.ret_msg || JSON.stringify(data)
						);
					}
					break;
				case "okx":
					response = await fetch(exchange.exchangeInfoUrl)
						.then(res => res.json())
						.then(res => {
							data = res;
						});
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

			currencySelect.innerHTML = "";

			if (symbols.length > 0) {
				symbols.sort();
				symbols.forEach(symbol => {
					const option = document.createElement("option");
					option.value = symbol;
					option.textContent = symbol;
					currencySelect.appendChild(option);
				});
				selectedSymbol = symbols[0];
				currencySelect.value = selectedSymbol;
				startPriceUpdates();
			} else {
				currencySelect.textContent = "--.-- USDT";
				currencySelect.innerHTML =
					'<option value="">لا توجد أزواج USDT متاحة</option>';
				if (priceUpdateInterval) clearInterval(priceUpdateInterval);
			}
		} catch (error) {
			console.error(`حدث خطأ في جلب أزواج العملات من ${exchange.name}:`, error);
			currentPriceDisplay.textContent = "خطأ في التحميل.";
			currencySelect.innerHTML = '<option value="">خطأ في التحميل</option>';
			if (priceUpdateInterval) clearInterval(priceUpdateInterval);
		}
	}

	async function fetchCurrentPrice(exchangeId, symbol) {
		const exchange = EXCHANGES[exchangeId];
		if (!exchange) return null;

		try {
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
					apiUrl = `${exchange.tickerPriceUrl}?symbol=${symbol}`;
					response = await fetch(apiUrl);
					data = await response.json();
					if (data.code === "200000" && data.data && data.data.price) {
						price = parseFloat(data.data.price);
					} else {
						console.error(
							`خطأ من KuCoin API (ticker):`,
							data.msg || JSON.stringify(data)
						);
					}
					break;
				case "bybit":
					apiUrl = `${exchange.tickerPriceUrl}?symbol=${symbol}`;
					response = await fetch(apiUrl);
					data = await response.json();
					if (data.ret_code === 0 && data.result && data.result.length > 0) {
						const ticker = data.result.find(t => t.symbol === symbol);
						if (ticker && ticker.last_price) {
							price = parseFloat(ticker.last_price);
						}
					} else {
						console.error(
							`خطأ من Bybit API (ticker):`,
							data.ret_msg || JSON.stringify(data)
						);
					}
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
				currentPriceDisplay.textContent = `${currentPrice.toFixed(4)} USDT`;
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
			fetchCurrentPrice(currentExchangeId, selectedSymbol);
			priceUpdateInterval = setInterval(
				() => fetchCurrentPrice(currentExchangeId, selectedSymbol),
				5000
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
			conditionText = `أصبح ≤ ${targetPrice} USDT`;
		} else if (condition === "greater_than_or_equal") {
			conditionText = `أصبح ≥ ${targetPrice} USDT`;
		}

		if (Notification.permission === "granted") {
			new Notification(`تنبيه سعر ${symbol}!`, {
				body: `وصل السعر إلى ${price} USDT. ${conditionText}`,
				icon: "https://www.google.com/s2/favicons?domain=binance.com", // يمكنك تغيير الأيقونة حسب المنصة
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
	// دالة لتعيين/حذف التنبيهات على Apps Script
	async function manageAlertOnAppsScript(action, alertData = null) {
		console.log(`إجراء: ${action}`, alertData);
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

	currencySelect.addEventListener("change", () => {
		selectedSymbol = currencySelect.value;
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

			localStorage.setItem("idChat", telegramChatId); // حفظ Chat ID في التخزين المحلي
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

			const success = await manageAlertOnAppsScript(
				"setAlert",
				newTelegramAlert
			);
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
	}
	// إظهار/إخفاء حقل Chat ID عند التحميل الأولي
	if (alertTypeTelegramCheckbox.checked) {
		telegramChatIdContainer.style.display = "block";
	} else {
		telegramChatIdContainer.style.display = "none";
	}
});

/* 
  
https://api.telegram.org/bot8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE/getWebhookInfo

https://api.telegram.org/bot7706768538:AAG08VBdNT9bD_L0mGGgQUEDgS08qHA14VA/deleteWebhook


https://api.telegram.org/bot8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE/setWebhook?url=https://us-central1-get-id-telegram.cloudfunctions.net/telegramWebhook


    */
/*  May code */
