// functions/data/alerts.js
const admin = require('firebase-admin');

// الوصول إلى Firestore بعد تهيئة admin SDK في index.js
const db = admin.firestore();
const ALERTS_COLLECTION = 'alerts'; // اسم المجموعة في Firestore

/**
 * إضافة أو تحديث تنبيه في Firestore.
 * @param {Object} alertData - بيانات التنبيه، يجب أن تحتوي على `id`.
 * @returns {Promise<string>} معرف التنبيه الذي تم إضافته/تحديثه.
 */
async function addAlert(alertData) {
    const docRef = db.collection(ALERTS_COLLECTION).doc(alertData.id);
    await docRef.set(alertData, { merge: true }); // استخدم merge لتحديث الوثائق الموجودة
    return alertData.id;
}

/**
 * حذف تنبيه من Firestore بمعرفه.
 * @param {string} alertId - معرف التنبيه المراد حذفه.
 * @returns {Promise<boolean>} true إذا تم الحذف، false إذا لم يتم العثور على التنبيه.
 */
async function deleteAlert(alertId) {
    const docRef = db.collection(ALERTS_COLLECTION).doc(alertId);
    const doc = await docRef.get();
    if (doc.exists) {
        await docRef.delete();
        return true;
    }
    return false;
}

/**
 * جلب جميع التنبيهات النشطة لـ Chat ID معين.
 * @param {string} telegramChatId - معرف دردشة تيليجرام.
 * @returns {Promise<Array<Object>>} مصفوفة من كائنات التنبيهات.
 */
async function getAlerts(telegramChatId) {
    const snapshot = await db.collection(ALERTS_COLLECTION)
                             .where('telegramChatId', '==', telegramChatId)
                             .where('status', '==', 'Active') // جلب التنبيهات النشطة فقط
                             .get();
    const alerts = [];
    snapshot.forEach(doc => {
        alerts.push({ id: doc.id, ...doc.data() }); // أضف معرف الوثيقة إلى البيانات
    });
    return alerts;
}

module.exports = {
    addAlert,
    deleteAlert,
    getAlerts
};