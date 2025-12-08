
import { getAuth } from "firebase-admin/auth";

async function authChngePswrd(email, currentPassword, newPassword) {
  try {
      // الحصول على مستخدم Firebase
      const auth = getAuth();
      const user = await auth.getUserByEmail(email);

      // إعادة توثيق المستخدم باستخدام البريد وكلمة السر الحالية
      const credential = await auth.createUser({
        email: email,
        password: currentPassword,
      });

      // تحديث كلمة السر للمستخدم
      await auth.updateUser(user.uid, { password: newPassword });

      // إرسال الرد بعد تغيير كلمة السر
      	return true
  } catch (error) {
          console.error("Error changing password:", error);

    return false;
  }
}

async function authSignUp(userEmail, userPassword) {
	try {
		if (!userEmail || !userPassword) {
			return { error: "userEmail and userPassword are required" };
		}

		const user = await getAuth().createUser({
			userEmail,
			userPassword,
		});

		return {
			status: "success",
		};
	} catch (error) {
		return {
			status: "error",
			message: error.message,
		};
	}
}

export {authChngePswrd ,authSignUp}