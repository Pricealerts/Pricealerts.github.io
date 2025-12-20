//const functions = require("firebase-functions");
import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
//import { auth } from "firebase-functions/v1";
import { cAllDatabase } from "./fncAlert/cAllDatabase.js";
import { checkAndSendAlerts } from "./fncAlert/srchSmbls.js";

//import { onUserCreated, onUserDeleted } from "firebase-functions/v2/auth";

initializeApp();

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

		const data = req.method === "POST" ? req.body : req.query;

		try {
			if (!data) {
				res.send("rah  " + data);
				return null;
			}

			const rslt = await cAllDatabase(data);
			const respons = JSON.stringify(rslt);
			res.status(200).json(respons);

			//  const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
			// res.send(`ذاكرة مستخدمة: ~${Math.round(usedMemory)}MB`);
		} catch (error) {
			console.error("error f proxyRequestV2 is :" + error);

			const err = JSON.stringify({
				error: "Failed to fetch data",
				status: "notSuccess",
				details: error.message,
			});
			return res.status(500).json(err);
		}
	}
);

export const scheduledTask = onSchedule(
	{
		schedule: "every 5 minutes",
		region: "europe-west1",
	},
	async () => {
		try {
			await checkAndSendAlerts();
		} catch (error) {
		return error;
		}
	}
);

//// on created

/* 

export const handleUserCreated = auth.user().onCreate(
  async (user) => {
    const userId = user.uid;
    const email = user.email || "notexist@gmail.com";
    const displayName = user.displayName || "notexistName";
    const photoURL = user.photoURL || "/imgs/camera-square-svgrepo-com.svg";

    const dataSet = {
      action: "creatuser",
      userId,
      email,
      displayName,
      photoURL,
    };

    await cAllDatabase(dataSet);

    return null;
  }
); */

