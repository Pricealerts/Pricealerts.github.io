import { initializeApp, getApps } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
	//stocksExchange,
	getExchangeSymbols,
	sendMesageFn,
	srchSmbls,
	price,
} from "pricealerts-utils";
// ضع توكن البوت هنا
// رسال الإيميلات باستخدام Nodemailer
// تهيئة التطبيق

if (!getApps().length) {
	initializeApp();
}

const BOT_TOKENEV = process.env.BOT_TOKEN;

export const telegramWebhook = onRequest(
	{ region: "europe-west1" },
	async (req, res) => {
		if (req.method !== "POST") {
			return res.status(405).send("Method Not Allowed");
		}

		const message = req.body.message;
		if (!message) {
			return res.status(200).send("No message");
		}
		const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKENEV}/sendMessage`;
		const chatId = message.chat.id;
		const username = message.from.username || "مستخدم بدون اسم";
		//const text = message.text || "";

		//console.log("Received from Telegram:", text);

		// 👇 مثال: إعادة إرسال نفس الرسالة مع إضافة ردّ
		// parse_mode: "HTML" // يمكنك استخدام Markdown أو HTML حسب الحاجة
		const reply = `أهلاً بك  ${username} 
			معرف دردشتك (Chat ID) الخاص بك هو : 
			<code>${chatId}</code> 
			إظعط عليه لنسخه وضعه في حقل "معرف دردشة التيليجرام" لتطبيق منبه الأسعار. `;

		try {
			await fetch(TELEGRAM_API, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					text: reply,
					parse_mode: "HTML",
				}),
			});

			res.status(200).send("Message sent");
		} catch (err) {
			console.error("Failed to send message", err);
			res.status(500).send("Failed to send message");
		}
	},
);

export const rqstStocks = onRequest(
	{ region: "europe-west1" },
	async (req, res) => {
		const origin = req.headers.origin;
		const allowedOrigins = [
			"https://pricealerts.github.io",
			"https://hostsite-80e14.web.app",
			"https://pricealerts.web.app",
			"http://127.0.0.1:4808",
		];

		if (allowedOrigins.includes(origin)) {
			res.set("Access-Control-Allow-Origin", origin);
		} else if (origin === undefined && req.body.orgn === "appsScriptDadi") {
			res.set("Access-Control-Allow-Origin", "*");
		} else {
			return res.status(403).send("Forbidden " + origin);
		}
		res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		res.set("Access-Control-Allow-Headers", "Content-Type");
		// Preflight
		if (req.method === "OPTIONS") {
			return res.status(204).send("");
		}

		const { action, querySmble } = req.body;
		try {
			const actionMap = {
				// stocksExchange: stocksExchange,
				srchSmbls: srchSmbls,
				sendMessage: sendMesageFn,
				gtPr: price,
			};
			const executeAction = actionMap[action];
			if (executeAction) {
				const response = await executeAction(querySmble);
				res.status(200).json(response);
			} else {
				console.log("kayn error");

				res.status(400).send("Unknown action: " + action);
			}

			// إرسال الرد كـ JSON مباشرة دون stringify يدوي
			return res.json(response);
		} catch (err) {
			res.status(500).json({ error: "Server error" });
		}
	},
);

// وظيفة شهرية
export const updtSmblsMnthly = onSchedule(
	{
		schedule: "0 0 1 * *",
		region: "europe-west1",
		maxInstances: 1,
		timeoutSeconds: 300, // 5 دقائق كافية جداً
	},
	async () => {
		try {
			await getExchangeSymbols();
			console.log("✅ تم التحديث الشهري بنجاح");
		} catch (error) {
			console.error("❌ فشل التحديث الشهري:", error);
			// لا نضع return هنا لأن الـ Scheduler لا ينتظر رداً
		}
	},
);

function fetchInChunks(allTickers) {
	const chunkSize = 8; // عدد الرموز في كل دفعة
	let allResults = [];

	for (let i = 0; i < allTickers.length; i += chunkSize) {
		// 1. تقسيم المصفوفة الكبيرة إلى قطعة صغيرة
		const chunk = allTickers.slice(i, i + chunkSize);

		// 2. تجهيز الطلبات لهذه الدفعة فقط
		const requests = chunk.map(symbol => ({
			url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
			method: "get",
			headers: { "User-Agent": LATEST_CHROME_UA },
			muteHttpExceptions: true,
		}));

		// 3. تنفيذ الدفعة الحالية بالتوازي
		const responses = UrlFetchApp.fetchAll(requests);
		allResults = allResults.concat(responses);

		// 4. "استراحة محارب" لمدة ثانيتين قبل الدفعة التالية (إلا في آخر دورة)
		if (i + chunkSize < allTickers.length) {
			// استراحة لمدة ثانيتين لتجنب الحظر
			Utilities.sleep(2000);
		}
	}

	return allResults;
}

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////




