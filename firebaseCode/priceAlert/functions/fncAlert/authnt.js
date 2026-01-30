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

async function sgnUp(userEmail, userPassword, userName, db) {
	try {
		if (!userEmail || !userPassword || !userName) {
			return { error: "userEmail and userPassword and userName are required" };
		}

		const rspns = await getAuth()
			.createUser({
				email: userEmail,
				password: userPassword,
				displayName: userName,
				photoURL : "https://pricealerts.web.app/imgs/web/icon-512-maskable.png",
			})
			.then(async user => {
				const infoUser = {
					userEmail: user.email,
					userName: user.displayName,
					userPicture: "./imgs/web/icon-512-maskable.png",
					chtId1: "",
					chtId2: "",
					chtId3: "",
					paid: false,
				};
				const rspnsDb =await db
					.ref(`users/${user.uid}`)
					.set(infoUser)
					.then(() => {
						return {
							status: true,
						};
					})
					.catch(error => {
						throw error;
					});
				return rspnsDb;
			})
			.catch(error => {
				throw error;
			});
			
			return rspns;
	} catch (error) {
		return {
			status: false,
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
			displayName: userRecord.displayName,
		};
	} catch (error) {
		if (error.code === "auth/user-not-found") {
			return {
				success: true,
				exists: false,
			};
		}

		console.error("Error fetching email:", error);
		return {
			success: false,
			error: error.message,
		};
	}
}








export { chngePswrd, sgnUp, gtEmail };
