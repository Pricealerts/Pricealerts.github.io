// في ملف index.js الخاص بك أو ملف الدالة
// 1. استيراد المكتبات باستخدام نظام الوحدات (Modular Imports)
import { initializeApp } from "firebase-admin/app";
import { getDatabase, ServerValue } from "firebase-admin/database";
import {
    onValueCreated,
    onValueUpdated,
    onValueDeleted,
} from "firebase-functions/v2/database";

// 2. تهيئة Firebase Admin SDK
// لا تحتاج إلى تمرير إعدادات، يتم التعرف عليها تلقائيًا في بيئة Functions
initializeApp();
const db = getDatabase();

/**
 * دالة تُشغّل عند إنشاء عنصر جديد في مسار '/posts/{postId}'.
 * تقوم بزيادة عداد المنشورات الكلي.
 */
export const onPostCreated = functions.database
    .ref("/posts/{postId}")
    .onCreate(async (snapshot, context) => {
        // 1. قراءة البيانات الجديدة
        const newPost = snapshot.val();
        const postId = context.params.postId;

        console.log(`New post ${postId} created with title: ${newPost.title}`);

        // 2. تحديث عداد المنشورات الكلي
        const countRef = db.ref("/metadata/post_count");

        // استخدام runTransaction لضمان أن التحديث آمن ومتزامن
        try {
            await countRef.transaction(currentCount => {
                // إذا لم يكن هناك قيمة سابقة، ابدأ بـ 0
                return (currentCount || 0) + 1;
            });
            console.log("Post count incremented successfully.");
            return null;
        } catch (error) {
            console.error("Transaction failed:", error);
            // إرجاع خطأ يدل على فشل العملية
            return error;
        }
    });

    /**
 * دالة تُشغّل عند تعديل منشور في '/posts/{postId}'.
 * تقوم بإضافة ختم زمني لآخر تعديل إذا تغير العنوان.
 */
export const onPostUpdatedV2 = onValueUpdated("/posts/{postId}", async (event) => {
    // event.data.before: القيمة قبل التعديل (Snapshot)
    // event.data.after: القيمة بعد التعديل (Snapshot)

    const previousPost = event.data.before.val();
    const updatedPost = event.data.after.val();
    const postId = event.params.postId;

    // 1. التحقق: هل تغير حقل العنوان؟
    if (previousPost.title === updatedPost.title) {
        console.log(`Title for post ${postId} did not change. Exiting.`);
        return null;
    }

    console.log(`Post ${postId} title changed. Updating last_modified timestamp.`);

    // 2. تحديث الحقل: استخدام event.data.after.ref هو أسهل طريقة
    return event.data.after.ref.update({
        // ServerValue.TIMESTAMP يضع قيمة وقت الخادم الحالية
        last_modified: ServerValue.TIMESTAMP 
    });
});

/**
 * دالة تُشغّل عند حذف منشور من '/posts/{postId}'.
 * تقوم بحذف التعليقات المرتبطة به وتخفيض العداد الكلي.
 */
export const onPostDeletedV2 = onValueDeleted("/posts/{postId}", async (event) => {
    // event.data هو Snapshot للقيمة التي تم حذفها
    const deletedPost = event.data.val();
    const postId = event.params.postId;

    console.log(`Post ${postId} with title "${deletedPost?.title}" was deleted. Initiating cleanup.`);

    // 1. تنظيف البيانات المرتبطة: حذف جميع التعليقات المرتبطة بهذا المنشور
    const commentsRef = db.ref(`/comments/${postId}`);
    await commentsRef.remove();
    console.log(`All comments for post ${postId} have been deleted.`);

    // 2. تخفيض عداد المنشورات الكلي
    const countRef = db.ref('/metadata/post_count');
    await countRef.transaction((currentCount) => {
        // ضمان عدم نزول العداد تحت الصفر
        return Math.max(0, (currentCount || 1) - 1);
    });
    console.log("Post count decremented successfully.");

    return null;
});

/* //const functions = require("firebase-functions");
import { https, database, region } from "firebase-functions";
 



export const makeUppercaseInEurope = region("europe-west1").database.ref('/messages/{pushId}/original')
    .onCreate((snapshot, context) => {
      // ... الكود البرمجي للدالة ...
});

 */
