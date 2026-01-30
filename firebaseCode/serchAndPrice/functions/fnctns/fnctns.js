import { getDatabase } from "firebase-admin/database";
import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const chatIdAbdelhadi = process.env.DADI_CHAT_ID;
let db;

// ------------------------
// جلب رموز بورصة واحدة من البورصات لخرين
// ------------------------
async function getExchangeSymbols() {
	if (!db) db = getDatabase();
	//const exchngsStk = ["XETRA", "HKEX", "LSE", "TSE", "NSE","SIX","XSWX","MTAA","XPAR","XSHG","XSHE","XSES"];
	const exchngsStk = [
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
		const promises = exchngsStk.map(e => exchangeSymbols(e));
		
		promises.push(...[
			gtStocks("https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv"),
			gtStocks("https://datahub.io/core/nyse-other-listings/r/nyse-listed.csv"),
			gateIoSmblsFn(),
		]); // nasdaq

		exchngsStk.push(...["nasdaq", "nyse", "gateIoSmbls"]);
		const rsltsPr = await Promise.all(promises);
		const errorProms = [];
		for (let i = 0; i < exchngsStk.length; i++) {
			if (rsltsPr[i].length > 5) {
				result[exchngsStk[i]] = rsltsPr[i];
			} else {
				errorProms.push(sndErr(exchngsStk[i]));
			}
		}
		await Promise.all(errorProms);
		await db.ref("stockSymbols").set(result);

		async function sndErr(exchngsStk) {
			const messageText = `slam 3likm Abdelhadi ${exchngsStk} rah khawi 3awd chofah `;
			await sendTelegramMessage(chatIdAbdelhadi, messageText);
			result[exchngsStk] =
				(await db.ref("stockSymbols").child(`${exchngsStk}`).get().val()) || [];
		}
	} catch (error) {
		console.log('kayn error f getExchangeSymbols : ');
		console.log(error);
	}
}

async function exchangeSymbols2(exchange) {
  try {
    const url = `https://api.twelvedata.com/stocks?exchange=${exchange}`;
    const res = await axios.get(url);
    return res.data?.data?.map(i => i.symbol) ?? [];
  } catch (error) {
    console.error(`error in exchangeSymbols (${exchange}):`, error);
    return [];
  }
}


async function exchangeSymbols(exchange) {
	try {
		const url = `https://api.twelvedata.com/stocks?exchange=${exchange}`;
		const res = await axios.get(url);
		if (!res) return [];
		return res.data.data.map(i => i.symbol) || [];
	} catch (error) {
		console.log("error in exchangeSymbols : ", error);
		return [];
	}
}

// -------------------------
async function gateIoSmblsFn() {
	try {
		const url = "https://api.gateio.ws/api/v4/spot/tickers";
		const res = await axios.get(url);
		const tickers = res.data;
		if (!Array.isArray(tickers)) {
			console.error("البيانات المستلمة ليست مصفوفة");
			console.log(tickers);
			return [];
		}
		return tickers.map(item => item.currency_pair) || [];
	} catch (error) {
		console.error("فشل جلب البيانات من Gate.io:", error);
		return [];
	}
}
// -------------------------
// ------------------------

// ------------------------
// جلب رموز   من البورصات nasdaq nyse
// ------------------------

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
	return row || [];
}
// ------------------------

// ------------------------
// nta3 database mn requer
// ------------------------
async function stocksExchange(exchange) {
	if (!db) db = getDatabase();
	try {
		const snap = await db.ref("stockSymbols").child(exchange).get();
		if (!snap.exists()) console.log(`لا توجد بيانات للبورصة: ${exchange}`);
		return snap.val();
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
			error.response ? error.response.data : error.message,
		);
		rspns = {
			success: false,
			error: error.response ? error.response.data : error.message,
		};
	}
	return rspns;
}

//get pice of symbole
/* async function price(smbl) {
	const urlPrice = `https://query1.finance.yahoo.com/v8/finance/chart/${smbl}?interval=1h&range=1d`;
	try {
		const response = await axios.get(urlPrice);
		const result = response.data?.chart?.result?.[0];

		if (!result) {
			return { error: "Symbol not found", smbl };
		}

		const q = result.indicators?.quote?.[0];
		const meta = result.meta;

		// ✅ تحسين: البحث عن آخر سعر إغلاق ليس null
		let lastClose = null;
		const prices = q?.close;
		if (prices) {
			for (let i = prices.length - 1; i >= 0; i--) {
				if (prices[i] !== null && prices[i] !== undefined) {
					lastClose = prices[i];
					break;
				}
			}
		}

		// ✅ الحالة 1: استخدام آخر سعر إغلاق موجود في المصفوفة
		if (lastClose !== null) {
			return {
				close: lastClose,
				currency: meta.currency,
			};
		}
		// ✅ الحالة 2: إذا فشلت المصفوفة، نستخدم سعر السوق المباشر من meta
		else if (meta && meta.regularMarketPrice) {
			return {
				close: meta.regularMarketPrice,
				currency: meta.currency,
			};
		}

		return { error: "No valid price data found", smbl };
	} catch (error) {
		console.error("Axios error:", error.message);
		return { error: "Failed to fetch data", details: error.message };
	}
} */

async function price2(smbl) {
	// 1. محاولة جلب السعر للرمز الأصلي أولاً
	const urlPrice = s =>
		`https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1h&range=1d`;

	try {
		let response = await axios.get(urlPrice(smbl));
		let result = response.data?.chart?.result?.[0];

		// 2. إذا لم يجد الرمز، نبحث عن رموز مشابهة (Suggestion)
		if (!result) {
			console.log(`🔍 الرمز ${smbl} غير موجود، جاري البحث عن اقتراحات...`);
			const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${smbl}`;
			const searchRes = await axios.get(searchUrl);
			const bestMatch = searchRes.data?.quotes?.[0]?.symbol; // أول نتيجة هي الأدق غالباً

			if (bestMatch && bestMatch !== smbl) {
				//console.log(`✅ تم العثور على رمز مشابه: ${bestMatch}`);
				// إعادة المحاولة بالرمز الجديد
				response = await axios.get(urlPrice(bestMatch));
				result = response.data?.chart?.result?.[0];
				if (!result) return { error: "Symbol not found", smbl };
			} else {
				return { error: "No matching symbol found", smbl };
			}
		}

		const q = result.indicators?.quote?.[0];
		const meta = result.meta;

		// البحث عن آخر سعر إغلاق (Loop)
		let lastClose = null;
		const prices = q?.close;
		if (prices) {
			for (let i = prices.length - 1; i >= 0; i--) {
				if (prices[i] !== null && prices[i] !== undefined) {
					lastClose = prices[i];
					break;
				}
			}
		}

		// إرجاع النتيجة (مع ذكر الرمز الحقيقي الذي تم استخدامه)
		return {
			symbol: meta.symbol, // الرمز النهائي (قد يختلف عن smbl الأصلي)
			close: lastClose || meta.regularMarketPrice,
			currency: meta.currency,
			name: meta.longName || meta.shortName,
		};
	} catch (error) {
		console.error("Error:", error);
		return { error: "Failed to fetch data", details: error.message };
	}
}

async function price(smbl) {
	const urlPrice = s =>
		`https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1h&range=1d`;
	const searchUrl = s =>
		`https://query2.finance.yahoo.com/v1/finance/search?q=${s}`;

	// إعداد الـ Headers لمحاكاة متصفح حقيقي وتجنب الـ 404 أو المنع
	const config = {
		headers: { "User-Agent": "Mozilla/5.0" },
	};

	try {
		let response;
		let result;

		try {
			// المحاولة الأولى: الرمز الأصلي
			response = await axios.get(urlPrice(smbl), config);
			result = response.data?.chart?.result?.[0];
		} catch (e) {
			// إذا أعطى 404، نترك result فارغة لننتقل للبحث
			result = null;
		}

		// إذا لم يجد الرمز أو حدث خطأ، نبحث عن اقتراحات
		if (!result) {
			console.log(`🔍 جاري البحث عن بديل لـ: ${smbl}`);
			const searchRes = await axios.get(searchUrl(smbl), config);
			const bestMatch = searchRes.data?.quotes?.[0]?.symbol;

			if (bestMatch) {
				console.log(`✅ وجدنا رمزاً مطابقاً: ${bestMatch}`);
				response = await axios.get(urlPrice(bestMatch), config);
				result = response.data?.chart?.result?.[0];
			}
		}

		if (!result) return { error: "Symbol not found", smbl };

		const q = result.indicators?.quote?.[0];
		const meta = result.meta;

		// استخراج السعر بذكاء
		let lastClose = null;
		if (q?.close) {
			for (let i = q.close.length - 1; i >= 0; i--) {
				if (q.close[i] !== null && q.close[i] !== undefined) {
					lastClose = q.close[i];
					break;
				}
			}
		}

		return {
			symbol: meta.symbol,
			close: lastClose || meta.regularMarketPrice,
			currency: meta.currency,
			name: meta.longName || meta.shortName,
		};
	} catch (error) {
		return {
			error: "Failed to fetch data",
			details: error.response?.data?.chart?.error?.description || error.message,
		};
	}
}

export { srchSmbls, price, stocksExchange, getExchangeSymbols, sendMesageFn };





