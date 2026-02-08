import { initializeApp, getApps } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { rtrnFn } from "./fnctns/fnctns.js";


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
		const data = req.method === "POST" ? req.body : req.query;
		
		try {
			const response = await rtrnFn(data);
			res.status(200).json(response);
			
		} catch (err) {
			res.status(500).json({ error: "Server error" });
		}
	},
);
