import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import Stripe from "stripe";


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
			console.log('data is :');
			console.log(data);
			
			 const { cAllDatabase } = await import("./fncAlert/cAllDatabase.js");
			const rslt = await cAllDatabase(data);
			if(!rslt) return false
			res.status(200).json(rslt);
			//  const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
			// res.send(`ذاكرة مستخدمة: ~${Math.round(usedMemory)}MB`);
		} catch (error) {
			console.error("error f proxyRequestV2 is : " + JSON.stringify(error));
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
		schedule: "*/5 * * * *" ,//evriday //schedule: "*/5 * * * *","0 9 * * *"
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



// تعريف المفتاح السري لـ Stripe بشكل آمن
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
import { getFirestore, FieldValue } from "firebase-admin/firestore";


const db3 = getFirestore();

const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// 1. دالة إنشاء نية الدفع (PaymentIntent) عند إضافة مستند جديد
export const createStripePaymentIntent = onDocumentCreated(
  {
	region: "europe-west1",
    document: "payments/{paymentId}",
    secrets: [stripeSecretKey],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const paymentData = snapshot.data();
    if (paymentData.client_secret) return;

    const stripe = new Stripe(stripeSecretKey.value());

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: paymentData.amount,
        currency: paymentData.currency || "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          firebaseDocId: event.params.paymentId,
          customerName: paymentData.customerName || "Unknown",
        },
      });

      await snapshot.ref.update({
        client_secret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: "requires_payment_method",
      });
    } catch (error) {
      console.error("خطأ في إنشاء الدفع:", error);
      await snapshot.ref.update({
        status: "failed",
        error: error.message,
      });
    }
  }
);

// 2. دالة Webhook لاستقبال إشعارات الدفع المؤكدة من خوادم Stripe
export const stripeWebhook = onRequest(
  {
	region: "europe-west1",
    secrets: [stripeSecretKey, stripeWebhookSecret],
  },
  async (req, res) => {
    const stripe = new Stripe(stripeSecretKey.value());
    const signature = req.headers["stripe-signature"];

    let event;

    try {
      // التحقق من أن الطلب قادم فعلاً من Stripe باستخدام rawBody
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      console.error("فشل التحقق من توقيع Webhook:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // التعامل مع حالات الدفع المختلفة
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const docId = paymentIntent.metadata.firebaseDocId;

        if (docId) {
          await db3.collection("payments").doc(docId).update({
            status: "succeeded",
            paidAt: FieldValue.serverTimestamp(),
            amountReceived: paymentIntent.amount_received,
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const failedIntent = event.data.object;
        const docId = failedIntent.metadata.firebaseDocId;

        if (docId) {
          await db3.collection("payments").doc(docId).update({
            status: "failed",
            error: failedIntent.last_payment_error?.message || "فشلت عملية السحب",
          });
        }
        break;
      }

      default:
        console.log(`حدث غير معالج: ${event.type}`);
    }

    // إرسال رد 200 لتأكيد استلام الإشعار بنجاح
    res.json({ received: true });
  }
);






