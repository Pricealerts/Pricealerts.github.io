import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// تهيئة Firebase Admin SDK
initializeApp();

// دالة للتحقق من التوكن
export const verifyIdToken = onRequest(
  { region: "europe-west1" },  // اختر المنطقة
  async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).send({ error: "يجب تقديم التوكن للتحقق" });
      }

      // التحقق من صحة التوكن
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.log("Decoded token:", decodedToken);

      // إذا تم التحقق بنجاح، أرسل الرد بالموافقة
      return res.status(200).send({ message: "تم التحقق من التوكن بنجاح" , uid: decodedToken.uid });
    } catch (error) {
      console.error("Error verifying ID token:", error);
      return res.status(401).send({ error: "توكن غير صالح أو منتهي" });
    }
  }
);
