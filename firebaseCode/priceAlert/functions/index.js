//const functions = require("firebase-functions");
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { cAllDatabase } from "./fncAlert/cAllDatabase.js";
import { checkAndSendAlerts } from "./fncAlert/srchSmbls.js";
// ⭐ يجب أن يتم قبل استيراد أي ملف يستخدم الـ Admin SDK
initializeApp();
// … بقية الكود

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
			console.error('error f proxyRequestV2 is :' + error);
			
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





import { onObjectFinalized } from "firebase-functions/v2/storage";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { getFirestore, FieldValue } from "firebase-admin/firestore";


const db = getFirestore();

// 2. إعداد المنطقة لجميع الدوال (اختياري، لكن يضمن أن كل شيء يعمل في europe-west1)
setGlobalOptions({ region: "europe-west1" });

/**
 * دالة تعمل عند اكتمال رفع ملف في Storage (الجيل الثاني v2)
 */
export const updateUserProfileImage = onObjectFinalized(
  {
    region: "europe-west1", // تحديد المنطقة للدالة
    // bucket: "your-bucket-name" // يمكنك تحديد اسم الـ bucket إذا كان لديك أكثر من واحد
  },
  async (event) => {
    // في الإصدار v2، بيانات الملف موجودة داخل event.data
    const fileData = event.data;

    // الحصول على مسار الملف (مثل: users/USER_ID/profile.jpg)
    const filePath = fileData.name;

    // التحقق: هل الملف صورة؟
    if (!fileData.contentType || !fileData.contentType.startsWith("image/")) {
      console.log("هذا الملف ليس صورة.");
      return;
    }

    // التحقق: هل الصورة داخل مجلد المستخدمين؟
    if (!filePath.startsWith("users/")) {
      console.log("الصورة ليست صورة بروفايل.");
      return;
    }

    // استخراج معرف المستخدم (ID) من المسار
    const parts = filePath.split("/");
    const userId = parts[1]; // الرقم بعد كلمة users

    // تجهيز رابط الصورة
    // ملاحظة: الروابط العامة تتطلب إعدادات خاصة، هذا الرابط يعمل إذا كان الـ bucket عاماً أو باستخدام token
    const bucketName = fileData.bucket;
    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;

    try {
      // تحديث وثيقة المستخدم في Firestore
      await db.collection("users").doc(userId).set(
        {
          photoURL: fileUrl,
          lastUpdated: FieldValue.serverTimestamp(),
        },
        { merge: true } // دمج البيانات (تحديث الحقول فقط دون حذف الباقي)
      );

      console.log(`تم تحديث صورة البروفايل للمستخدم: ${userId} في المنطقة europe-west1`);
    } catch (error) {
      console.error("فشل تحديث قاعدة البيانات:", error);
    }
  }
);

