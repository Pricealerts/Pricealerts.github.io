const functions = require("firebase-functions");
const admin = require("firebase-admin");

// تهيئة تطبيق الأدمن للوصول لقاعدة البيانات
admin.initializeApp();

const db = admin.firestore();

/**
 * 1. دالة تعمل تلقائياً عند إنشاء مستخدم جديد
 * الهدف: إنشاء مستند في مجموعة "users" في Firestore يحمل نفس الـ UID
 */
exports.onUserCreated = functions.auth.user().onCreate((user) => {
  // الحصول على بيانات المستخدم من عملية التسجيل
  const { uid, email, displayName, photoURL } = user;

  // إنشاء مرجع للمستند
  const userDocRef = db.collection("users").doc(uid);

  // البيانات التي نريد تخزينها
  const userData = {
    email: email,
    displayName: displayName || "مستخدم جديد", // قيمة افتراضية إذا لم يتوفر الاسم
    photoURL: photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    role: "user", // يمكن تحديد صلاحيات افتراضية
  };

  // الحفظ في قاعدة البيانات وإرجاع الـ Promise
  return userDocRef.set(userData)
    .then(() => {
      console.log(`User profile created for ${uid}`);
    })
    .catch((error) => {
      console.error("Error writing document: ", error);
    });
});

/**
 * 2. دالة تعمل تلقائياً عند حذف مستخدم
 * الهدف: حذف بيانات المستخدم من Firestore لتنظيف قاعدة البيانات
 */
exports.onUserDeleted = functions.auth.user().onDelete((user) => {
  const { uid } = user;

  // مرجع المستند المراد حذفه
  const userDocRef = db.collection("users").doc(uid);

  // حذف المستند وإرجاع الـ Promise
  return userDocRef.delete()
    .then(() => {
      console.log(`User profile deleted for ${uid}`);
    })
    .catch((error) => {
      console.error("Error removing document: ", error);
    });
});