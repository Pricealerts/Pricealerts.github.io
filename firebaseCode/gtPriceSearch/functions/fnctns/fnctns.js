import axios from "axios";

let BOT_TOKENEV;
if (!BOT_TOKENEV) {
	BOT_TOKENEV = process.env.BOT_TOKEN;
}
let chatIdAbdelhadi;
if (!chatIdAbdelhadi) {
	chatIdAbdelhadi = process.env.DADI_CHAT_ID;
}

async function rtrnFn(data) {
	const { action, smbl } = data;
	const actionMap = {
		srchSmbls: srchSmbls,
		sendMessage: sendMesageFn,
		gtPr: price,
	};
	const executeAction = actionMap[action];
	if (executeAction) {
		const response = await executeAction(smbl);
		return response;
	} else {
		console.log("kayn error");
		return { error: "Unknown action: " + action };
	}
}

// ------------------------
// جلب رموز بورصة واحدة من البورصات لخرين
// ------------------------

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
	if (!BOT_TOKENEV || BOT_TOKENEV === "YOUR_BOT_TOKENEV") {
		return { success: false, error: "توكن بوت تيليجرام غير موجود." };
	}
	let rspns = {};
	const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKENEV}/sendMessage`;

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
const agents = [
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 OPR/130.0.0.0",
];
let conter = 0;
async function price(smbl) {
	if (Array.isArray(smbl)) {
		const prms = smbl.map(s => price(s));
		const rpns = await Promise.all(prms);
		return rpns;
	}
	const urlPrice = s =>
		`https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1h&range=1d`;
	const searchUrl = s =>
		`https://query2.finance.yahoo.com/v1/finance/search?q=${s}`;

	// إعداد الـ Headers لمحاكاة متصفح حقيقي وتجنب الـ 404 أو المنع
	const config = {
		headers: {
			"User-Agent": agents[Math.floor(Math.random() * agents.length)],
		},
	};
	try {
		let response;
		let result;
		try {
			response = await axios.get(urlPrice(smbl), config);
			result = response.data?.chart?.result?.[0];
		} catch (e) {
			// إذا أعطى 404، نترك result فارغة لننتقل للبحث
			result = null;
		}

		// إذا لم يجد الرمز أو حدث خطأ، نبحث عن اقتراحات
		if (!result) {
			const searchRes = await axios.get(searchUrl(smbl), config);
			const bestMatch = searchRes.data?.quotes?.[0]?.symbol;

			if (bestMatch) {
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
		conter = 0;
		return {
			symbol: meta.symbol,
			price: lastClose || meta.regularMarketPrice,
			currency: meta.currency,
			//name: meta.longName || meta.shortName,
			exchangeName: meta.exchangeName,
		};
	} catch (error) {
		conter++;
		if (conter < 3) return await price(smbl);
		return {
			error: "Failed to fetch data",
			details: error.response?.data?.chart?.error?.description || error,
		};
	}
}

export { rtrnFn };
