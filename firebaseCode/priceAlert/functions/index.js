import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();
export const proxyRequestV2 = onRequest(
	{
		region: "europe-west1",
		memory: "256MiB",
		maxInstances: 1,
		timeoutSeconds: 60, // حاول تقليلها إذا كان الجلب سريعاً
	},
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
		} else if ( req.body.orgn === "appsScriptDadi") {
			res.set("Access-Control-Allow-Origin", "*");
		} else {
			return res.status(403).send("Forbidden" + origin);
		}
		res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		res.set("Access-Control-Allow-Headers", "Content-Type");
		 if (req.method === "OPTIONS") return res.status(204).send(""); // ⬅️ مهم
  
		const data = req.method === "POST" ? req.body : req.query;
		try {
			if (!data) {
				res.send("rah khawi" + data);
				return null;
			}
			 const { cAllDatabase } = await import("./fncAlert/cAllDatabase.js");
			const rslt = await cAllDatabase(data);
			if(!rslt) return false
			res.status(200).json(rslt);
			//  const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
			// res.send(`ذاكرة مستخدمة: ~${Math.round(usedMemory)}MB`);
		} catch (error) {
			console.error("error f proxyRequestV2 is :");
			console.log(error);
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
		schedule: "0 9 * * *" ,//evriday //schedule: "*/5 * * * *","0 9 * * *"
		region: "europe-west1",
		memory: "256MiB",
		maxInstances: 1,
		timeoutSeconds: 120, // حاول تقليلها إذا كان الجلب سريعاً
	},
	async () => {
            // ✅ استيراد ملف التنبيهات (الذي يحتوي غالباً على nodemailer) ديناميكياً
            const { checkAndSendAlerts } = await import("./fncAlert/srchSmbls.js");
		try {
			await checkAndSendAlerts();
		} catch (error) {
			 console.error("Scheduled task failed:", error);
      throw error; // مهم جدًا لإعلام نظام الجدولة بحدوث خطأ
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


