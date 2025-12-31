import { getDatabase } from "firebase-admin/database";
import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const chatIdAbdelhadi = process.env.DADI_CHAT_ID;

let db;
// ------------------------
// جلب رموز بورصة واحدة من البورصات لخرين
// ------------------------
async function getExchangeSymbols() {
	db = getDatabase();
	//const exchanges = ["XETRA", "HKEX", "LSE", "TSE", "NSE","SIX","XSWX","MTAA","XPAR","XSHG","XSHE","XSES"];
	const exchanges = [
		"HKEX",
		"LSE",
		"NSE",
		"SIX",
		"XSWX",
		"XPAR",
		"XSHG",
		"XSHE",
		"XSES",
	];
	try {
		const result = {};
		const promises = [];
		for (let i = 0; i < exchanges.length; i++) {
			promises.push(exchangeSymbols(exchanges[i]));
		}
		const rsltsPr = await Promise.all(promises);
		for (let i = 0; i < rsltsPr.length; i++) {
			if (rsltsPr[i].length > 5) {
				result[exchanges[i]] = rsltsPr[i];
			} else {
				const messageText = `slam 3likm Abdelhadi ${exchanges[i]} rah khawi 3awd chofah `;
				await sendTelegramMessage(chatIdAbdelhadi, messageText);
			}
		}

		const naNy = await gtNasdaqNyseStocks();
		const allExch = { ...result, ...naNy };

		let aryAllExch = Object.entries(allExch);
		const promisesDb = [];

		for (let i = 0; i < aryAllExch.length; i++) {
			const vl = aryAllExch[i][1];
			if (vl.length > 5) {
				promisesDb.push(
					db.ref("stockSymbols").child(`${aryAllExch[i][0]}`).set(vl)
				);
			}
		}
		await Promise.all(promisesDb);
	} catch (error) {
		return "حدث خطأ" + error;
	}
}

async function exchangeSymbols(exchange) {
	//const url = `https://api.nasdaq.com/api/screener/stocks?tableonly=true&exchange=${exchange}`;
	try {
		const url = `https://api.twelvedata.com/stocks?exchange=${exchange}`;
		const res = await axios.get(url);
		const data = res.data.data.map(i => i.symbol);

		if (!data) return [];
		return data;
	} catch (error) {
		return error;
	}
}

// ------------------------

// ------------------------
// جلب رموز   من البورصات nasdaq nyse
// ------------------------
async function gtNasdaqNyseStocks() {
	const exchangs = ["nasdaq", "nyse"];

	const urls = [
		"https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv",
		"https://datahub.io/core/nyse-other-listings/r/nyse-listed.csv",
	];

	let symbols = {};
	const promises = [];
	try {
		for (let i = 0; i < urls.length; i++) {
			const url = urls[i];
			promises.push(gtStocks(url));
		}
		const rslt = await Promise.all(promises);
		symbols = {
			nasdaq: rslt[0],
			nyse: rslt[1],
		};

		return symbols;
		//return symbols;
	} catch (error) {
		console.error(error);
		// res.status(500).json({ error: error.message });
	}
}
async function gtStocks(url) {
	const ftch = await axios.get(url);
	const csv = ftch.data;
	// تحويل CSV إلى مصفوفة
	const rows = csv.split("\n").map(r => r.split(","));
	// تجاوز الصف الأول (الرؤوس)
	const row = rows
		.slice(1)
		.map(r => r[0])
		.filter(Boolean);
	//symbols[exchangs[i]] = row;
	return row;
}
// ------------------------

// ------------------------
// nta3 database mn requer
// ------------------------
async function stocksExchange(exchange) {
	db = getDatabase();
	try {
		const snap = await db.ref("stockSymbols").child(exchange).get();
		const data = snap.val();
		return data;
	} catch (error) {
		return "حدث خطأ" + error;
	}
}
// ------------------------

async function srchSmbls(querySmble) {
	const apiUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${querySmble}`;
	let responseFnl = [];

	try {
		let rslt = (await axios.get(apiUrl)).data.quotes;
		for (const quote of rslt) {
			const estCandle = {
				symbol: quote.symbol,
				exchDisp: quote.exchDisp,
				shortname: quote.shortname,
				quoteType: quote.quoteType,
			};
			responseFnl.push(estCandle);
		}
	} catch (error) {
		return {
			error: "Failed to fetch data1",
			details: error.message,
		};
	}

	return responseFnl;
}

/////// nta3 message
async function sendMesageFn(messageText) {
	try {
		const msag = `عبدالهادي جائتك رسالة من ${messageText.nameUser} 
ايميله : ${messageText.emailUser} 
الرسالة : ${messageText.msageUser} 
 `;

		await sendTelegramMessage(chatIdAbdelhadi, msag);
		return { statusMsge: "ok" };
	} catch (error) {
		return { statusMsge: "no" };
	}
}

/////// nta3 telegram
async function sendTelegramMessage(chatId, messageText) {
	if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "YOUR_TELEGRAM_BOT_TOKEN") {
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

//get pice of symbole
async function price(smbl) {
	const urlPrice = `https://query1.finance.yahoo.com/v8/finance/chart/${smbl}?interval=1h&range=1d`;
	let responsePost = {};
	try {
		const response = await axios.get(urlPrice);
		const data = response.data;
		const result = data.chart.result && data.chart.result[0];

		if (!result || result.length === 0) {
			return { error: "Symbol not found", smbl };
		}

		const timestamps = result.timestamp;
		const q = result.indicators?.quote?.[0];
		const meta = result.meta;

		// ✅ الحالة 1: بيانات شموع حقيقية متوفرة
		if (timestamps && q && q.close && q.close.length > 0) {
			const i = q.close.length - 1;
			responsePost = {
				close: q.close[i],
				currency: meta.currency,
			};
		} else if (meta && meta.regularMarketPrice) {
			// ✅ الحالة 2: لا توجد بيانات شموع → نُنشئ شمعة تقديرية من meta
			responsePost = {
				close: meta.regularMarketPrice,
				currency: meta.currency,
			};
		} else {
			responsePost = { error: "No valid price data found", smbl };
		}
		return responsePost;
	} catch (error) {
		console.error("Axios error:", error.message);
		return {
			error: "Failed to fetch data 2",
			details: error.message,
		};
	}
}
export { srchSmbls, price, stocksExchange, getExchangeSymbols, sendMesageFn };
