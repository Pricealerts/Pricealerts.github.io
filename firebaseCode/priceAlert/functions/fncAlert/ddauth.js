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

		const rspns =await getAuth()
			.createUser({
				email: userEmail,
				password: userPassword,
				displayName: userName,
			})
			.then(async user => {
				const infoUser = {
					userEmail: user.email,
					userName: user.displayName,
					userPicture: "https://pricealerts.web.app/imgs/user-svgrepo-com.svg",
					chtId1: "",
					chtId2: "",
					chtId3: "",
					paid: false,
					/* 	lastLogin: new Date().toISOString(),
						status: "online", */
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
						console.log("Error setDt user:", error);
						throw error;
					});
				return rspnsDb;
			})
			.catch(error => {
				console.log("Error creating new user:", error);
				throw error;
			});
			
			return rspns;
	} catch (error) {
		console.log("err sgnUp is : " + error);
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
