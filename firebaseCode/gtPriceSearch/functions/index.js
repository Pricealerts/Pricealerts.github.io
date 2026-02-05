import { initializeApp, getApps } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import {
	srchSmbls,sendMesageFn,
	price,
} from  "pricealerts-utils"; 
// ضع توكن البوت هنا
// رسال الإيميلات باستخدام Nodemailer
// تهيئة التطبيق 

if (!getApps().length) {
	initializeApp();
}

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
