import { getDatabase } from "firebase-admin/database";
import { sndEmail } from "./sndEmail.js";

let db; // تعريف المتغير في الخارج (Global) دون إعطائه قيمة فورية

// ✅ دالة لجلب المرجع (Ref) عند الحاجة إليه خارج هذا الملف
export const getAlertsRef = () => {
    if (!db) db = getDatabase();
    return db.ref("alerts");
};

export async function cAllDatabase(data) {
    // ✅ تهيئة القاعدة مرة واحدة فقط عند أول استدعاء (Lazy Init)
    if (!db) db = getDatabase();

    if (!data.userPassword) {
        data.userPassword = "qsfqzrqsqle7610dqsdepllpl";
    }
    if (!data.paid) data.paid = false;

    // المرجع داخلي هنا لضمان السرعة
    const postsRef = db.ref("alerts");

    try {
        const action = data.action;
        let rspns;

        // منطق العمليات (Switch/If)
        if (action === "gtAlerts") {
            rspns = await gtAlerts(data);
        }
        // ... بقية العمليات ...

        return rspns;
    } catch (error) {
        console.error("❌ Error in cAllDatabase:", error.message);
        throw new Error(error.message);
    }
}