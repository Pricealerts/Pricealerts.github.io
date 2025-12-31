import fetch from "node-fetch"; // تأكد أنك ثبّتته في package.json

import { onRequest } from "firebase-functions/v2/https";

// ضع توكن البوت هنا
// رسال الإيميلات باستخدام Nodemailer

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
		const text = message.text || "";

		console.log("Received from Telegram:", text);

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
	}
);
/* 
export const imageProxyPost = onRequest(
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

		const { action, idImg } = req.body;

		if (action !== "gtImage" || !idImg) {
			return res.status(400).json({ error: "Invalid request" });
		}

		try {
			const imageUrl = `https://drive.google.com/thumbnail?id=${idImg}&sz=w800`;
			const response = await fetch(imageUrl);

			if (!response.ok) {
				return res.status(400).json({ error: "Failed to fetch image" });
			}

			const buffer = await response.arrayBuffer();
			res.set(
				"Content-Type",
				response.headers.get("content-type") || "image/png"
			);

			res.status(200).send(Buffer.from(buffer));
		} catch (err) {
			res.status(500).json({ error: "Server error" });
		}
	}
);
 */