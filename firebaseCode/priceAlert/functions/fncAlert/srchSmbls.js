import axios from "axios";
import { EXCHANGES_CONFIG, gtapiUrl } from "./cnstnts.js";
import { cAllDatabase } from "./cAllDatabase.js";

// *** بيانات اعتماد Telegram Bot API ***
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;

//const APPS_SCRIPT_WEB_APP_URL =
//	"https://script.google.com/macros/s/AKfycbz0hE-JXd26WjQtLOwp3SZI5_x5ZETBZjWPxFutRyZiPMDn01khIam6tVxBanNl-O2s/exec";

function getIntLmt(requestTimeStr) {
	const currentTriggerTime = new Date(); // وقت تشغيل الـ Trigger الحالي
	let requestTime = new Date(requestTimeStr);
	let timeDifferenceMs = currentTriggerTime.getTime() - requestTime.getTime();
	let timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));

	let interval;
	let limit;

	if (timeDifferenceMinutes <= 5) {
		// إذا كان الفارق 0-5 دقائق، استخدم شموع 1 دقيقة
		interval = "1m";
		limit = Math.max(1, timeDifferenceMinutes); // على الأقل شمعة واحدة
	} else {
		// إذا كان الفارق أكبر من 5 دقائق، استخدم شمعة 5 دقائق واحدة
		interval = "5m";
		limit = 1;
	}
	return { interval, limit };
}

//////////////// get candles
async function getCandles(allAlerts) {
	const symbolsMap = new Map();
	// 1. التكرار لتجميع الرموز وتحديد أفضل إعدادات لكل رمز
	allAlerts.forEach(row => {
		const { exchangeId, symbol, requestTime } = row;
		// حساب الـ Interval والـ Limit بناءً على دالتك
		const { interval: currentInterval, limit: currentLimit } =
			getIntLmt(requestTime);
		if (symbolsMap.has(symbol)) {
			const existing = symbolsMap.get(symbol);
			// --- منطق المفاضلة ---
			// 1. أولوية المنصة: إذا ظهرت Binance نعتمدها كمصدر
			const finalExchange =
				exchangeId === "binance" ? "binance" : existing.exchangeId;
			// 2. أولوية الـ Interval: إذا كان أحدهما 1m والآخر 5m، نفضل الـ 1m لأنه يعطي تفاصيل أدق
			// ( أو يمكنك عكس المنطق حسب رغبتك )
			const finalInterval =
				existing.interval === "1m" || currentInterval === "1m" ? "1m" : "5m";
			// 3. أولوية الـ Limit: نأخذ الأكبر دائماً لضمان تغطية الفارق الزمني الأطول
			const finalLimit = Math.max(existing.limit, currentLimit);
			symbolsMap.set(symbol, {
				exchangeId: finalExchange,
				interval: finalInterval,
				limit: finalLimit,
			});
		} else {
			// أول ظهور للرمز
			symbolsMap.set(symbol, {
				exchangeId,
				interval: currentInterval,
				limit: currentLimit,
			});
		}
	});

	const symbolsOrder = Array.from(symbolsMap.keys());
	// 2. تحويل الخريطة (Map) إلى وعود (Promises) لجلب البيانات
	const promises = symbolsOrder.map(symbol => {
		const config = symbolsMap.get(symbol);
		return fetchCandlestickData(
			config.exchangeId,
			symbol,
			config.interval,
			config.limit
		).catch(err => {
			console.error(
				`❌ Error fetching ${symbol} from ${config.exchangeId} err is  :`
			);
			console.log(err);
			return null;
		});
	});
	// 3. تنفيذ جميع الطلبات بالتوازي
	const results = await Promise.all(promises);
	// 4. بناء الكائن النهائي
	const candles = {};
	results.forEach((data, index) => {
		const symbol = symbolsOrder[index];
		// حتى لو كانت النتيجة null، نضعها في الكائن للحفاظ على مرجع للرمز
		candles[symbol] =
			data && Array.isArray(data) && data.length > 0 ? data : null;
	});
	return candles;
}

async function checkAndSendAlerts() {
	const data = await cAllDatabase({ action: "gtAlerts", chid: "all" });
	if (!data) return false;
	let allAlerts = [];
	const usersAll = Object.entries(data);
	usersAll.forEach(user => {
		const idUser = user[0];
		const alrts = Object.entries(user[1]);
		alrts.forEach(alert => {
			const alrt = alert[1];
			alrt.id = alert[0];
			alrt.telegramChatId = idUser;
			allAlerts.push(alrt);
		});
	});

	const rsltcandles = await getCandles(allAlerts);
	// نتكرر على الصفوف من الأسفل للأعلى لسهولة الحذف
	let dltRwApp = [];
	for (let i = allAlerts.length - 1; i >= 0; i--) {
		// البدء من آخر صف بيانات (باستثناء الرؤوس)
		const {
			exchangeId,
			symbol,
			targetPrice,
			alertCondition,
			telegramChatId,
			id,
		} = allAlerts[i];

		const candles = rsltcandles[symbol];
		let triggeredByHistoricalPrice = false;
		let actualTriggerPrice = null; // لتسجيل السعر الذي تسبب في التنبيه
		if (candles && candles.length > 0) {
			// إذا كانت الشموع 1m، يجب أن نفحص كل شمعة
			for (const candle of candles) {
				if (alertCondition === "less") {
					if (candle.low <= targetPrice) {
						triggeredByHistoricalPrice = true;
						actualTriggerPrice = candle.low;
						break; // وجدنا التحقق، لا داعي لمواصلة الفحص
					}
				} else if (alertCondition === "greater") {
					if (candle.high >= targetPrice) {
						triggeredByHistoricalPrice = true;
						actualTriggerPrice = candle.high;
						break; // وجدنا التحقق، لا داعي لمواصلة الفحص
					}
				}
			}
		} else {
			console.warn(`لم يتم الحصول على بيانات شمعة  لـ ${symbol} على 
				${EXCHANGES_CONFIG[exchangeId].name}. قد تكون حدود API أو عدم توفر البيانات.`);
		}

		if (triggeredByHistoricalPrice) {
			let message = `🔔 تنبيه سعر ${
				EXCHANGES_CONFIG[exchangeId].name
			}!<b>${symbol}</b> بلغت <b>${actualTriggerPrice}</b> (الشرط: السعر ${
				alertCondition === "less" ? "أقل من أو يساوي" : "أعلى من أو يساوي"
			} ${targetPrice})`;
			const nwChatId = telegramChatId.slice(3);
			let sendResult = await sendTelegramMessage(nwChatId, message);

			if (sendResult.success) {
				let dlt = { telegramChatId: telegramChatId, id: id, alrtOk: true };
				dltRwApp.push(dlt);
				// بما أننا حذفنا الصف، يجب أن نقلل الفهرس لتجنب تخطي صفوف
				allAlerts.slice(i, 1); // إزالة الصف المحذوف من مصفوفة البيانات المحلية أيضًا
			} else {
				// إذا فشل الإرسال، لا تحذف التنبيه حتى يمكن المحاولة مرة أخرى لاحقًا
				console.error(
					`فشل إرسال إشعار تيليجرام لـ ${symbol}:`,
					sendResult.error
				);
			}
		}
	}
	await dltForDatabase(dltRwApp);
}

/**
 * دالة لجلب بيانات الشموع (OHLCV) من المنصة المحددة لفترة معينة.
 * @param {string} exchangeId - معرف المنصة.
 * @param {string} symbol - رمز العملة (مثال: BTCUSDT).
 * @param {string} interval - الفاصل الزمني للشمعة (مثال: '1m', '5m', '15m').
 * @param {number} limit - عدد الشموع المراد جلبها.
 * @returns {Array<Object> | null} مصفوفة من كائنات الشموع أو null في حالة الفشل.
 */
async function fetchCandlestickData(exchangeId, symbol, interval, limit) {
	const exchange = EXCHANGES_CONFIG[exchangeId];
	if (
		!exchange ||
		!exchange.candlestickUrl ||
		!exchange.parseCandle ||
		!exchange.intervalMap[interval]
	) {
		return null;
	}
	symbol = symbol.replace("$", "");
	const now = new Date();
	const endTimeMs = now.getTime();

	// لحساب وقت البدء لطلب الشمعة الأخيرة
	const intervalMs = parseIntervalToMilliseconds(interval);
	// نحدد وقت البدء لضمان الحصول على الشموع المطلوبة بالضبط
	const startTimeMs = endTimeMs - intervalMs * limit;

	try {
		let datas;
		let mappedInterval = exchange.intervalMap[interval];

		const apiUrl = gtapiUrl(exchangeId, symbol, mappedInterval, limit);
		datas = (await axios.get(apiUrl)).data;

		let candles = [];
		if (exchangeId === "binance") {
			candles = datas.map(exchange.parseCandle);
		} else if (exchangeId === "kucoin") {
			if (datas.code === "200000") {
				let data2 = datas.data.map(exchange.parseCandle);
				for (let i = 0; i < limit; i++) {
					candles.push(data2[i]);
				}
			} else {
				console.error(
					`خطأ من ${exchange.name} API (شموع):`,
					datas.msg || JSON.stringify(datas)
				);
			}
		} else if (exchangeId === "okx") {
			if (datas.code === "200000" || datas.code === "0") {
				candles = datas.data.map(exchange.parseCandle);
			} else {
				console.error(
					`خطأ من ${exchange.name} API (شموع):`,
					datas.msg || JSON.stringify(datas)
				);
			}
		} else if (exchangeId === "bybit") {
			candles = datas.result.list.map(exchange.parseCandle);
		} else if (exchangeId === "bitget") {
			candles = datas.data.map(exchange.parseCandle);
		} else if (exchangeId === "lbank") {
			candles = [datas.data[0].ticker].map(exchange.parseCandle);
		} else if (exchangeId === "coincap") {
			if (datas.ret_code === 0 && datas.result) {
				candles = datas.result.map(exchange.parseCandle);
			} else {
				console.error(
					`خطأ من ${exchange.name} API (شموع):`,
					datas.ret_msg || JSON.stringify(datas)
				);
			}
		} else if (exchangeId === "coingecko") {
			const now = Date.now();
			const fiveMinutesAgo = now - 5 * 60 * 1000;

			// تصفية الأسعار في آخر 5 دقائق
			const pricesLast5Min = datas.prices.filter(
				item => item[0] >= fiveMinutesAgo
			);

			const open = pricesLast5Min[0][1];
			const close = pricesLast5Min[pricesLast5Min.length - 1][1];
			const high = Math.max(...pricesLast5Min.map(p => p[1]));
			const low = Math.min(...pricesLast5Min.map(p => p[1]));
			datas = [
				[new Date(pricesLast5Min[0][0]).toISOString(), open, high, low, close],
			];

			candles = datas.map(exchange.parseCandle);
		} else if (exchangeId === "kraken") {
			let lmtSlc = mappedInterval * limit;
			let dtSlc = datas.result[symbol].slice(0, lmtSlc);

			candles = dtSlc.map(exchange.parseCandle);
		} else if (exchangeId === "coinbase") {
			if (datas) {
				let lastTim = 0;
				let indData = 0;
				datas.forEach((e, ind) => {
					if (e[0] > lastTim) {
						lastTim = e[0];
						indData = ind;
					}
				});
				let dtSlc = [datas[indData]];
				candles = dtSlc.map(exchange.parseCandle);
			}
		} else {
			if (Array.isArray(datas) && datas.length) {
				candles = datas.map(exchange.parseCandle);
			} else {
				console.error(
					`خطأ من ${exchange.name} API (شموع):`,
					JSON.stringify(datas)
				);
			}
		}

		let candles2 = candles.slice(-limit);
		return candles2;
	} catch (error) {
		console.error(
			//${symbol}
			`خطأ في جلب بيانات الشموع لـ  من ${exchange.name}:`,
			error
		);
		return null;
	}
}

async function dltForDatabase(dltRwApp) {
	if (dltRwApp.length == 0) {
		return "walo";
	}

	try {
		const promises = [];

		for (let i = 0; i < dltRwApp.length; i++) {
			const dlt = dltRwApp[i];
			dlt.action = "dltAlrt";
			promises.push(cAllDatabase(dlt));
		}
		await Promise.all(promises);
	} catch (error) {
		console.error(
			"error  respons",
			error.response ? error.response.data : error.message
		);
		return {
			success: false,
			error: error.response ? error.response.data : error.message,
		};
	}
}
/**
 * دالة مساعدة لتحويل الفاصل الزمني النصي إلى مللي ثانية.
 */
function parseIntervalToMilliseconds(interval) {
	const value = parseInt(interval.slice(0, -1));
	const unit = interval.slice(-1);
	switch (unit) {
		case "m":
			return value * 60 * 1000; // minutes
		case "h":
			return value * 60 * 60 * 1000; // hours
		case "d":
			return value * 24 * 60 * 60 * 1000; // days
		case "w":
			return value * 7 * 24 * 60 * 60 * 1000; // weeks
		default:
			return 0; // Should not happen with defined intervals
	}
}

/**
 * دالة لإرسال رسالة Telegram.
 */
async function sendTelegramMessage(chatId, messageText) {
	if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "YOUR_TELEGRAM_BOT_TOKEN") {
		console.error("TELEGRAM_BOT_TOKEN غير معرّف أو غير صالح.");
		return { success: false, error: "توكن بوت تيليجرام غير موجود." };
	}
	let rspns = {};
	const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
	let payload = {
		chat_id: chatId,
		text: messageText,
		parse_mode: "HTML",
	};

	try {
		const response = await axios.post(TELEGRAM_API_URL, payload);

		rspns = { success: true, response: response.data };
	} catch (error) {
		console.error(
			"خطأ في إرسال رسالة تيليجرام:",
			error.response ? error.response.data : error.message
		);
		rspns = {
			success: false,
			error: error.response ? error.response.data : error.message,
		};
	}
	return rspns;
}

export { checkAndSendAlerts, sendTelegramMessage };
