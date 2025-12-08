//const functions = require("firebase-functions");
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
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

/* 

 */

// onSchedule v2
export const scheduledTask = onSchedule(
	{
		schedule: "every 5 minutes",
		region: "europe-west1",
	},
	async () => {
		try {
			await checkAndSendAlerts();
		} catch (error) {
			console.log("error " + error);
		}
	}
);

// إنشاء secrets
/* 
	const GMAIL_EMAIL = "pricealerts08@gmail.com";
	const GMAIL_PASSWORD = "nots iokr juqq haul";

export const sendVerificationEmail = onCall(
    { region: "europe-west1" },
    async (data) => {
        // البيانات القادمة من العميل
        const userEmail = data.userEmail;
        const userName = data.userName;

        if (!userEmail || !userName) {
            return { status: "error", message: "يرجى توفير userEmail و userName" };
        }

        // إنشاء كود التحقق
        const code = Math.floor(100000 + Math.random() * 900000);

        try {
            // إنشاء transporter
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: await GMAIL_EMAIL.get(),
                    pass: await GMAIL_PASSWORD.get(),
                },
            });

            // محتوى الإيميل
            const htmlBody = `
                <div style="font-family: Arial, sans-serif;">
                    <h2>مرحباً ${userName} 👋</h2>
                    <p>رمز التحقق الخاص بك هو:</p>
                    <h1>${code}</h1>
                </div>
            `;

            // إرسال الإيميل
            await transporter.sendMail({
                from: await GMAIL_EMAIL.get(),
                to: userEmail,
                subject: "تأكيد بريدك الإلكتروني",
                html: htmlBody,
            });

            return { status: "success", code }; // يمكن حذف code إذا لا تريد إرساله للعميل
        } catch (error) {
            console.error("Error sending email:", error);
            return { status: "error", message: error.message };
        }
    }
);
 */

// imports v2
//import { getFirestore, FieldValue } from "firebase-admin/firestore";

//const db = getFirestore();

/**
 * 1️⃣ دالة تعمل عند إنشاء مستخدم جديد
 */
/* export const onUserCreatedV2 = onUserCreated(
	{ region: "europe-west1" },
	async event => {

		try {
			if (!data) {
				res.send("rah  " + data);
				return null;
			}

			const rslt = await cAllDatabase(event.data);
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
 */





