import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
	srchSmbls,
	price,
	stocksExchange,
	getExchangeSymbols,
	sendMesageFn,
} from "./fnctns/fnctns.js";

// تهيئة التطبيق
initializeApp();

export const proxyRequestV2 = onRequest(
	{
		region: "europe-west1",
		memory: "256MiB", // رفعناها لـ 256 لضمان عدم حدوث Error 128MB
		maxInstances: 1,
		minInstances: 0, // لضمان عدم الصرف وقت الخمول
		concurrency: 1,
		timeoutSeconds: 30, // زدناها قليلاً لضمان اكتمال العمليات الخارجية
	},
	async (req, res) => {
		// --- معالجة CORS ---
		const origin = req.headers.origin;
		const allowedOrigins = [
			"https://pricealerts.github.io",
			"https://hostsite-80e14.web.app",
			"https://pricealerts.web.app",
			"http://127.0.0.1:4808",
		];

		if (allowedOrigins.includes(origin)) {
			res.set("Access-Control-Allow-Origin", origin);
		} else if (origin) {
			// إذا كان هناك أصل غير مدعوم
			console.log("is forbidden origin");
			return res.status(403).send("Forbidden Origin");
		}

		if (req.method === "OPTIONS") {
			res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			res.set("Access-Control-Allow-Headers", "Content-Type");
			return res.status(204).send("");
		}

		// --- استخراج البيانات ---
		const rqust = req.method === "POST" ? req.body : req.query;
		const action = rqust.action;
		const querySmble = rqust.querySmble;
		try {
			if (!action) {
				return res.status(400).send("Action is missing");
			}

			let repond;
			const actionMap = {
				smbls: srchSmbls,
				price: price,
				stocksExchange: stocksExchange,
				sendMessage: sendMesageFn,
			};
			const executeAction = actionMap[action];
			if (executeAction) {
				const response = await executeAction(querySmble);
				res.json(response);
			} else {
				res.status(400).send("Unknown action: " + action);
			}

			// إرسال الرد كـ JSON مباشرة دون stringify يدوي
			return res.status(200).json(repond);
		} catch (error) {
			console.error("Internal Error:", error);
			return res.status(500).json({
				error: "Failed to fetch data",
				details: error.message,
			});
		}
	}
);

// وظيفة شهرية (مصححة)
export const updateSymbolsMonthly = onSchedule(
	{
		schedule: "0 0 1 * *",
		region: "europe-west1",
		memory: "256MiB", // الذاكرة الكافية لمنع تكرار الفشل
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
	}
);

/* 
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
                    return res.status(400).send("Unknown action: " + action);
            } */