import axios from "axios";
import { EXCHANGES_CONFIG, gtapiUrl, ftcgAppScrpt } from "./cnstnts.js";
import { cAllDatabase } from "./cAllDatabase.js";

// *** بيانات اعتماد Telegram Bot API ***
let TELEGRAM_BOT_TOKEN;
const getBotToken = () => {
	if (!TELEGRAM_BOT_TOKEN) {
		TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
	}
	return TELEGRAM_BOT_TOKEN; // إرجاع القيمة كضمان إضافي
};

/* function getIntLmt(requestTimeStr) {
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
} */

//////////////// get candles
async function getCandles(symbolsMap) {
	const symbolsOrder = Array.from(symbolsMap.keys());
	const promises = symbolsOrder.map(symbol => {
		const config = symbolsMap.get(symbol);
		return fetchCandlestickData(
			config.exchangeId,
			symbol,
			"5m", //config.interval,
			1, //config.limit
		).catch(err => {
			console.error(
				`❌ Error fetching ${symbol} from ${config.exchangeId} err is  :`,
			);
			console.error(err);
			return null;
		});
	});
	symbolsMap.clear();
	const results = await Promise.all(promises);
	const candles = {};
	results.forEach((data, index) => {
		const symbol = symbolsOrder[index];
		candles[symbol] =
			data && Array.isArray(data) && data.length > 0 ? data : null;
	});
	//console.log('cndlis is : ' + JSON.stringify(candles));

	return candles;
}

async function checkAndSendAlerts() {
	let data = await cAllDatabase({ action: "gtAlerts", chid: "all" });

	if (!data.stat) return false;
	let allAlerts = [];
	let symbolsMap = new Map();
	let stocksMap = new Map();
	let usersAll = Object.entries(data.alerts);
	data = null;
	usersAll.forEach(user => {
		const tlgId = user[0];
		const alrts = Object.entries(user[1]);
		alrts.forEach(alert => {
			const isStock = stocksFn(alert, tlgId);
			if (isStock) return false;

			const alrt = alert[1];
			const { e, s, e2: exchangeId = e, s2: symbol = s } = alrt;
			if (!symbolsMap.has(symbol)) {
				symbolsMap.set(symbol, { exchangeId });
			}
			alrt.i = alert[0];
			alrt.tid = tlgId;
			allAlerts.push(alrt);
		});
	});
	function stocksFn(alert, tlgId) {
		const alrt = alert[1];
		const { e, e2: exchangeId = e, s: symbol, mt: meta } = alrt;
		if (meta) {
			const now = Date.now();
			const startTime = meta.st * 1000;
			const endTime = meta.end * 1000;
			const exchangeDate = new Date(Date.now() + meta.gm * 1000); // gmtoffset
			const exchangeToday = exchangeDate.getUTCDate();
			if ((now < startTime || now > endTime) && exchangeToday == meta.oDy)
				return true;
		}
		if (!EXCHANGES_CONFIG[exchangeId]) {
			if (!stocksMap.has(symbol)) stocksMap.set(symbol, []);
			stocksMap.get(symbol).push({ i: alert[0], tid: tlgId, ...alrt });
			return true;
		}
		return false;
	}

	usersAll = null;
	if (stocksMap.size > 0) ftcgAppScrpt(stocksMap);
	if (!symbolsMap.size === 0) return false;
	const rsltcandles = await getCandles(symbolsMap);
	// نتكرر على الصفوف من الأسفل للأعلى لسهولة الحذف
	let promises = [];
	for (let k = 0; k < allAlerts.length; k++) {
		const {
			e: exchangeId,
			s: symbol,
			s2,
			t: targetPrice,
			c: alertCondition,
			tid: telegramChatId,
			i: id,
			//mt: meta,
			f: factorPric,
		} = allAlerts[k];

		const candles = rsltcandles[s2];
		let triggeredByHistoricalPrice = false;
		let actualTriggerPrice = null;
		const rglrChatId = telegramChatId.slice(3);
		if (candles && candles.length > 0) {
			const trgtFctor = targetPrice / factorPric;
			for (const candle of candles) {
				if (alertCondition === "l" && candle.low <= trgtFctor) {
					// less
					triggeredByHistoricalPrice = true;
					actualTriggerPrice = candle.low;
					break;
				} else if (alertCondition === "g" && candle.high >= trgtFctor) {
					//greater
					triggeredByHistoricalPrice = true;
					actualTriggerPrice = candle.high;
					break;
				}
			}
		} /* else {console.warn(`لم يتم الحصول على بيانات شمعة  لـ ${symbol} على 
		${EXCHANGES_CONFIG[exchangeId].name}. قد تكون حدود API أو عدم توفر البيانات.`)} */

		if (triggeredByHistoricalPrice) {
			const message = `🔔 تنبيه سعر ${
				EXCHANGES_CONFIG[exchangeId].name
			}!<b>${symbol}</b> بلغت <b>${actualTriggerPrice}</b> (الشرط: السعر ${
				alertCondition === "l" ? "أقل من أو يساوي" : "أعلى من أو يساوي"
			} ${targetPrice})`;

			const dlt = {
				action: "dltAlrt",
				tId: telegramChatId,
				id: id,
				//	alrtOk: true,
			};
			promises.push(cAllDatabase(dlt));
			promises.push(sendTelegramMessage(rglrChatId, message));
			continue;
		}
	}
	allAlerts = [];
	await chngOfDb(promises);
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
		!exchange.parseCandle //||
		//!exchange.intervalMap[interval]
	) {
		return null;
	}
	symbol = symbol.replace(/\$\g/, "");
	//const now = new Date();
	//const endTimeMs = now.getTime();

	// لحساب وقت البدء لطلب الشمعة الأخيرة
	//const intervalMs = parseIntervalToMilliseconds(interval);
	// نحدد وقت البدء لضمان الحصول على الشموع المطلوبة بالضبط
	//const startTimeMs = endTimeMs - intervalMs * limit;

	try {
		let datas;
		let mappedInterval = exchange.intervalMap[interval];

		const apiUrl = gtapiUrl(exchangeId, symbol, mappedInterval, limit);
		const axs = await axios.get(...apiUrl);
		datas = axs.data;

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
					datas.msg || JSON.stringify(datas),
				);
			}
		} else if (exchangeId === "okx") {
			if (datas.code === "200000" || datas.code === "0") {
				candles = datas.data.map(exchange.parseCandle);
			} else {
				console.error(
					`خطأ من ${exchange.name} API (شموع):`,
					datas.msg || JSON.stringify(datas),
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
					datas.ret_msg || JSON.stringify(datas),
				);
			}
		} else if (exchangeId === "coingecko") {
			const now = Date.now();
			const fiveMinutesAgo = now - 5 * 60 * 1000;
			// تصفية الأسعار في آخر 5 دقائق
			const pricesLast5Min = datas.prices.filter(
				item => item[0] >= fiveMinutesAgo,
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
		} else if (exchangeId === "cryptocompare") {
			candles = datas.Data.Data;
		} else {
			if (Array.isArray(datas) && datas.length) {
				candles = datas.map(exchange.parseCandle);
			} else {
				console.error(
					`خطأ من ${exchange.name} API (شموع):`,
					JSON.stringify(datas),
				);
			}
		}
		let candles2 = candles.slice(-limit);
		return candles2;
	} catch (error) {
		console.error(
			//${symbol}
			`خطأ في جلب بيانات الشموع لـ  من ${exchange.name}:`,
			error,
		);
		return null;
	}
}

async function chngOfDb(promises) {
	if (!promises || promises.length == 0) return;
	try {
		await Promise.all(promises);
	} catch (error) {
		console.error("error respons", error);
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
	const token = getBotToken();

	let rspns = {};
	const TELEGRAM_API_URL = `https://api.telegram.org/bot${token}/sendMessage`;
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
			error.response ? error.response.data : error.message,
		);
		rspns = {
			success: false,
			error: error.response ? error.response.data : error.message,
		};
	}
	return rspns;
}

export { checkAndSendAlerts, sendTelegramMessage };
