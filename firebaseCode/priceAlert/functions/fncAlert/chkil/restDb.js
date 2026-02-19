/* import { initializeApp } from "firebase-admin/app";
import { onValueWritten } from "firebase-functions/v2/database";

initializeApp();

// تعمل عند أي تغيير في users/{userId}
export const onUserChanged = onValueWritten(
	{
		ref: "/users/{userId}",
		region: "europe-west1",
	},
	async event => {
		const before = event.data.before.val(); // القيمة القديمة
		const after = event.data.after.val(); // القيمة الجديدة
		const userId = event.params.userId; // القيمة الجديدة

		const data = { action: "chngeDb", userId: userId };
		await cAllDatabase(data);
		console.log("🔔 User changed:", userId);
		console.log("Before:", before);
		console.log("After:", after);

		// ⚡ هنا ضع ما تريد فعله عند تغيير المستخدم
		// مثال:
		// await cAllDatabase(userId, after);
		// await checkAndSendAlerts(userId, after);

		return null;
	}
);


import { onValueCreated } from "firebase-functions/v2/database";

//// on created
export const onUserCreated = onValueCreated(
	{
		ref: "/users/{userId}",
		region: "europe-west1",
	},
	async event => {
		const userId = event.params.userId;
		const data = event.data.val(); // بيانات المستخدم بعد الإنشاء

		const email = data?.email || "❌ لا يوجد إيميل في البيانات";
		const dataSet = { action: "chngeDb",email:email, userId: userId };
		await cAllDatabase(dataSet);
		console.log("🟢 User CREATED:", userId);
		console.log("📧 Email:", email);
		console.log("📦 Data:", data);

		// ⚡ هنا ضع ما تريد تنفيذه عند الإنشاء فقط
		// مثال:
		// await sendWelcomeEmail(email);
		// await saveUserInAnalytics(userId, data);

		return null;
	}
);
 */