//const functions = require("firebase-functions");
import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
	srchSmbls,
	price,
	stocksExchange,
	getExchangeSymbols,
	sendMesageFn /* 
	gtNasdaqNyseStocks */,
} from "./fnctns/fnctns.js";

// ⭐ يجب أن يتم قبل استيراد أي ملف يستخدم الـ Admin SDK
initializeApp();

export const proxyRequestV2 = onRequest(
	{
		region: "europe-west1",
		memory: "128MiB", // أقل ذاكرة
		cpu: 1, // افتراضي (لا ترفعها)
		maxInstances: 1, // Instance واحدة فقط
		minInstances: 0, // لا تبقى شغالة
		concurrency: 1, // طلب واحد فقط
		timeoutSeconds: 15, // لا تنتظر كثيرًا
	},
	async (req, res) => {
		// تعيين رؤوس CORS
		const origin = req.headers.origin;
		const allowedOrigins = [
			"https://pricealerts.github.io",
			"https://hostsite-80e14.web.app",
			"https://pricealerts.web.app",
			"http://127.0.0.1:4808" /* ,
		"https://pricealerts.web.app/otherPage/contact.html" */,
		];
		if (allowedOrigins.includes(origin)) {
			res.set("Access-Control-Allow-Origin", origin);
		} else {
			return res.status(403).send("Forbidden" + origin);
		}
		// ⚠️ أخرج مباشرة لطلبات OPTIONS (CORS)
		if (req.method === "OPTIONS") {
			res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			res.set("Access-Control-Allow-Headers", "Content-Type");
			return res.status(204).send("");
		}
		if (req.method === "OPTIONS") {
			return res.status(204).send("");
		}

		const action = req.method === "POST" ? req.body.action : req.query.action;
		try {
			if (!action) {
				res.send("rah khawi " + action);
				return null;
			}

			let repond;
			const querySmble =
				req.method === "POST" ? req.body.querySmble : req.query.querySmble;
			switch (action) {
				case "smbls":
					repond = await srchSmbls(querySmble);
					break;
				case "price":
					repond = await price(querySmble);
					break;
				case "stocksExchange":
					repond = await stocksExchange(querySmble);
					break;
				case "sendMesage":
					repond = await sendMesageFn(querySmble);
					break;
				default:
					console.error("منصة غير مدعومة لجلب السعر:", exchangeId);
					break;
			}

			const stRpnd = JSON.stringify(repond);
			res.status(200).json(stRpnd);

			return null;
		} catch (error) {
			return res.status(500).json({
				error: "Failed to fetch data 0",
				details: error.message,
			});
		}
	}
);

// ------------------------
// وظيفة أسبوعية للتحديث
// ------------------------
export const updateSymbolsWeekly = onSchedule(
	{
		schedule: "every 720 hours",
		region: "europe-west1",
		memory: "128MiB",
		cpu: 1,
		maxInstances: 1,
		timeoutSeconds: 60, // لا تتركها مفتوحة
	},
	async () => {
		await getExchangeSymbols();
	}
);

/* 
/////////////////////////
///////////////////////////
/////////////////////////////
    nta3 query1.finance.yahoo.com
*/
