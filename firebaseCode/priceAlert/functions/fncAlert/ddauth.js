import { getAuth } from "firebase-admin/auth"; // استيراد getAuth من firebase-admin

async function chngePswrd(email, newPassword) {
	try {
		const userRecord = await getAuth().getUserByEmail(email);
		const userid = userRecord.uid;
		await getAuth().updateUser(userid, { password: newPassword });

		return { success: true };
	} catch (error) {
		console.error("Error changing password:", error);
		return { success: false, message: error.message };
	}
}

async function sgnUp(userEmail, userPassword, userName) {
	try {
		if (!userEmail || !userPassword || !userName) {
			return { error: "userEmail and userPassword are required" };
		}

		const user = await getAuth().createUser({
			email: userEmail,
			password: userPassword,
			displayName: userName,
			photoURL: "/imgs/camera-square-svgrepo-com.svg",
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



async function gtEmail(email) {
	try {
		const userRecord = await getAuth().getUserByEmail(email);

		return {
			success: true,
			exists: true,
			uid: userRecord.uid,
			email: userRecord.email,
		};
	} catch (error) {
		console.error("Error fetching emails:", error);
		return {
			success: false,
			error: error.message,
		};
	}
}

export { chngePswrd, sgnUp, gtEmail };
