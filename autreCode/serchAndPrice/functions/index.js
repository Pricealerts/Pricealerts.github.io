//const functions = require("firebase-functions");
import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
	srchSmbls,
	price,
	stocksExchange,
	getExchangeSymbols,/* 
	gtNasdaqNyseStocks */
} from "./fnctns/fnctns.js";


// ⭐ يجب أن يتم قبل استيراد أي ملف يستخدم الـ Admin SDK
initializeApp();

function acspt(req, res) {
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
		return false;
	}
	res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.set("Access-Control-Allow-Headers", "Content-Type");
	return true;
}

export const proxyRequestV2 = onRequest(
	{ region: "europe-west1" },
	async (req, res) => {
		// تعيين رؤوس CORS
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
		 return res.status(403).send("Forbidden" + origin);
	}
	res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.set("Access-Control-Allow-Headers", "Content-Type");
		/* let acs = acspt(req, res) ;
		if (!acs) {
			 return res.status(403).send("Forbidden" + origin);
		} */
	
		
		const action = req.method === "POST" ? req.body.action : req.query.action;
		try {
			
			if (!action) {
				res.send("rah khawi " + action);
				return null;
			}

			let repond;
			const querySmbl =
				req.method === "POST" ? req.body.querySmble : req.query.querySmble;
			switch (action) {
				case "smbls" :
					repond = await srchSmbls(querySmbl);
					break;
				case "price":
					repond = await price(querySmbl);
					break;
				case "stocksExchange":
					repond = await stocksExchange(querySmbl);
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
		schedule: "every 168 hours", // كل أسبوع
		region: "europe-west1",
	},
	async () => {
		await getExchangeSymbols();

		console.log("✔ تم تحديث رموز الأسهم الأسبوعية");
	}
);

/* 
/////////////////////////
///////////////////////////
/////////////////////////////
    nta3 query1.finance.yahoo.com
*/

