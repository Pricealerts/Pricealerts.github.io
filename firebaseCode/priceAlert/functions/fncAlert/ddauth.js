import { getAuth } from "firebase-admin/auth"; // استيراد getAuth من firebase-admin

async function chngePswrd(email, currentPassword, newPassword) {
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
		return true;
	} catch (error) {
		console.error("Error changing password:", error);

		return false;
	}
}

async function sgnUp(userEmail, userPassword) {
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

async function vrfIdToken(req) {
	try {
		const { idToken } = req.body.result;

		if (!idToken) {
			console.log("mafihch idtpkn :");
			console.log(idToken);

			return { error: "يجب تقديم التوكن للتحقق" };
		}

		// التحقق من صحة التوكن
		const decodedToken = await getAuth().verifyIdToken(idToken);
		console.log("Decoded token:", decodedToken);

		// إذا تم التحقق بنجاح، أرسل الرد بالموافقة
		return { message: "تم التحقق من التوكن بنجاح", uid: decodedToken.uid };
	} catch (error) {
		console.error("Error verifying ID token:", error);
		return { error: "توكن غير صالح أو منتهي" };
	}
}






async function  gtAllEmails(data){
try {
    const userRecord = await getAuth().getUserByEmail(email);

        return res.status(200).json({
          success: true,
          exists: true,
          uid: userRecord.uid,
          email: userRecord.email,
        });
    } catch (error) {
      console.error("Error fetching emails:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
}



export { chngePswrd, sgnUp, vrfIdToken ,gtAllEmails };
