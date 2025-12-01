/**
 * Import function triggers from v2
 */
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { setGlobalOptions } from "firebase-functions/v2/options";

/**
 * Import Admin SDK to interact with DB and Storage
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database"; // Realtime DB
import { getStorage } from "firebase-admin/storage";   // Storage (للحذف)

// 1. تهيئة التطبيق
initializeApp();

let dbFirestore;
let dbRealtime ;
let storage ;

// 2. ضبط المنطقة لجميع الدوال
setGlobalOptions({ region: "europe-west1" });

/**
 * الدالة الرئيسية: تعمل بعد رفع أي ملف
 */
async function valdProfileImgeAndSet(event) {
      dbFirestore = getFirestore();
 dbRealtime = getDatabase();
 storage = getStorage();
    const fileData = event.data;
    const filePath = fileData.name; // مثال: users/Mohamed/profile.jpg
    const bucketName = fileData.bucket;
    const contentType = fileData.contentType;

    // --- (أ) فلترة أولية: هل الملف في مجلد users؟ وهل هو صورة؟ ---
    
    // إذا لم يكن في مجلد users، لا نتدخل (أو يمكن حذفه أيضاً إذا أردت صرامة أكثر)
    if (!filePath.startsWith("users/")) {
      console.log("الملف ليس في مجلد users، تم تجاهله.");
      return;
    }

    // إذا لم يكن صورة، نحذفه فوراً لتنظيف التخزين
    if (!contentType || !contentType.startsWith("image/")) {
      console.log("الملف ليس صورة. جاري الحذف...");
      await storage.bucket(bucketName).file(filePath).delete();
      return;
    }

    // --- (ب) استخراج معرف المستخدم والتحقق من Realtime DB ---

    const parts = filePath.split("/");
    const userId = parts[1]; // الاسم الموجود بعد users/

    try {
      // البحث عن المستخدم في Realtime Database
      const rtdbRef = dbRealtime.ref(`users/${userId}`);
      const snapshot = await rtdbRef.get();

      // --- السيناريو 1: المستخدم غير موجود (محاولة اختراق أو خطأ) ---
      if (!snapshot.exists()) {
        console.warn(`تحذير: المستخدم ${userId} غير موجود في Realtime DB. جاري حذف الصورة المرفوعة.`);
        
        // الحذف الفوري للصورة من Storage
        await storage.bucket(bucketName).file(filePath).delete();
        return;
      }

      // --- السيناريو 2: المستخدم موجود (عملية شرعية) ---
      
      // إنشاء رابط الصورة (Download URL)
      // بما أن الـ Rules مفتوحة (if true)، يمكننا استخدام هذا الرابط المباشر
      const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;

      // تحديث Firestore ليظهر في التطبيق
      await dbFirestore.collection("users").doc(userId).set(
        {
          photoURL: fileUrl,
          lastUpdated: FieldValue.serverTimestamp(),
        },
        { merge: true } // دمج البيانات
      );

      console.log(`تم قبول الصورة وتحديث البروفايل للمستخدم: ${userId}`);

    } catch (error) {
      console.error("حدث خطأ غير متوقع:", error);
    }
}


export const validateAndSetProfileImage = onObjectFinalized(
  {
    region: "europe-west1",
    // cpu: 1, // يمكنك ضبط الموارد هنا إذا أردت
  },
  async (event) => {
   await valdProfileImgeAndSet(event);
  }
);