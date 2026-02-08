import { initializeApp, getApps } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { rtrnFn, getExchangeSymbols } from "./fnctns/fnctns.js";


if (!getApps().length) {
	initializeApp();
}

let BOT_TOKENEV;
if (!BOT_TOKENEV) {
	BOT_TOKENEV = process.env.BOT_TOKEN;
}
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

		const data = req.method === "POST" ? req.body : req.query;
		
		try {
			const response = await rtrnFn(data);
			res.status(200).json(response);
			
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
		} catch (error) {
			console.error("❌ فشل التحديث الشهري:", error);
			// لا نضع return هنا لأن الـ Scheduler لا ينتظر رداً
		}
	},
);



