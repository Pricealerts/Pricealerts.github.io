//import { defineSecret } from "firebase-functions/params";
import { cAllDatabase } from "./cAllDatabase.js";
import {authChngePswrd ,authSignUp} from "./auth.js";

let db;

async function sndEmail(data, dtbs) {
	db = dtbs;
	const action = data.action;
	const userEmail = data.userEmail.toLowerCase();
	let reponse;
	try {
		if (["sndMsgCnferIn", "sndMsgCnfer"].includes(action)) {
			await rmovInArryDb(userEmail);

			reponse = await sendVerificationEmail(userEmail, data.userName);
		} else if (["cnfrmCode", "addAccont"].includes(action)) {
			const ovrNmb = await overNmber(userEmail);
			if (ovrNmb) {
				reponse = { status: "overNmber" };
			} else {
				reponse = await verifyCode(data);
			}
		} else if (action == "updtPsw") {
			const bdyFirebase = {
				action: "updatePsw",
				userEmail: userEmail,
				userPassword: data.userPassword,
			};
			reponse = await updtPswd(bdyFirebase);
		}

		return reponse;
	} catch (err) {
		console.log("err sndEmail is : " + err);

		reponse = { status: "notSend is" + err };
	}
}

async function overNmber(userEmail) {
	try {
		const arr = await gtDb();
		if (!arr) return false;

		const fltr = arr.filter(item => item[0] == userEmail);

		let data = fltr[0];
		if (data[2] > 5) {
			const now = new Date().getTime();
			const oldTime = data[3];
			const diff = (now - oldTime) / 1000 / 60;
			if (diff >= 60) {
				data[3] = 1;
				let dtSet = arr.filter(item => item[0] != userEmail);
				dtSet.push(data);
				const ref = db.ref("allSndEmails");
				await ref.set(dtSet);
				return false;
			}
			return true;
		}
		return false;
	} catch (error) {
		console.log("error overNmber is : " + error);
		return false;
	}
}
async function sendVerificationEmail(userEmail, userName) {
	const code = Math.floor(100000 + Math.random() * 900000);

	try {
		const bodySnd = {
			action: "sndMsgCnfer",
			userEmail: userEmail,
			userName: userName,
			code: code,
		};
		const WEB_APP_URL = //
			"https://script.google.com/macros/s/AKfycbyPSbiRBdAKQIQiV4eqMZZgb3IM1x_Fp89UPSkCvABNpp4BMOVnRh75_JblSB3Mx0Ls/exec"; // رابط apps script

		const response = await fetch(WEB_APP_URL, {
			method: "POST",
			// headers: { "Content-Type": "application/json" },
			body: JSON.stringify(bodySnd),
		});

		const result = await response.json();

		if (result.status == "success") {
			const oldTime = new Date().getTime();
			const stDt = [userEmail, code, 1, oldTime];
			// append to database
			const arr = await gtDb();
			let arrFnl = [];
			if (arr) arrFnl = arr;
			arrFnl.push(stDt);
			await db.ref("allSndEmails").set(arrFnl);
			return { status: "success" };
		}
		return { status: "notsuccess" };
	} catch (error) {
		console.log("error sendVerificationEmail is : " + error);

		return { status: "notsuccess" };
	}
}

async function verifyCode(data) {
	const userEmail = data.userEmail;
	try {
		let gtData = await gtDb();
		let respns = { status: "notExist" };
		if (!gtData) return respns;
		let fltr = gtData.filter(item => item[0] == userEmail);
		if (fltr.length > 0) {
			let arow = fltr[0];
			arow[2] = arow[2] + 1;
			arow[3] = new Date().getTime(); // oled date
			if (arow[1] == data.inputCode) {
				if (signUp) {
					await rmovInArryDb(userEmail);
					const auSignUp =await authSignUp(userEmail, data.userPassword);
					if (auSignUp.status == "success") {
						await db.ref(`allAcconts/${data.userId}`).set(data)
						return { status: "exist" };
					}
					return { status: "notExist" };
				}
				arow[4] = true;
				respns = { status: "exist" };
			}
			let dtSet;
			dtSet = gtData.filter(item => item[0] != userEmail);

			dtSet.push(arow);
			await db.ref("allSndEmails").set(dtSet);
		}
		return respns;
	} catch (error) {
		console.log("verifyCode err : " + error);
		return { status: "notExist" };
	}
}

async function updtPswd(data) {
	try {
		let gtData = await gtDb();
		if (!gtData) return { status: "notSucsus" };
		let fltr = gtData.filter(item => item[0] == data.userEmail);
		const data2 = fltr[0];
		if (fltr.length > 0 && data2[4] == true) {
			// حذف القيمة "abdou"
			await rmovInArryDb(data.userEmail);
			// كتابة المصفوفة بعد التعديل
			const usrData = await cAllDatabase(data);
			if (usrData.status == "success") {
				const user = usrData.rslt;
				//delete rslt.userId;
				const nwPasword = data.userPassword;
				const updt= await authChngePswrd(data.userEmail, usrData.userPassword, nwPasword)
				if(!updt) return { status: "notSuccess" }
				let { userId, ...nwRslt } = user;
				nwRslt.userPassword = nwPasword;
				await db.ref(`allAcconts/${user.userId}`).set(nwRslt);
				const { userPassword, paid, ...rslt } = nwRslt;
				return { status: "success", rslt: rslt };
			} else {
				return { status: "notSuccess" };
			}
		}
		return;
	} catch (error) {
		console.log(" error updtPsw is: " + error);

		return { status: "notexsist", message: "not exist email" };
	}
}
async function rmovInArryDb(userEmail) {
	let arr = await gtDb();

	if (arr != false) {
		const fltr = arr.filter(item => item[0] == userEmail);
		if (fltr.length == 0) {
			return false;
		}
		arr = arr.filter(item => item[0] !== userEmail);
		await db.ref("allSndEmails").set(arr);
		return true;
	}
	return false;
}
async function gtDb() {
	try {
		const snapshot = await db.ref("allSndEmails").get();
		if (!snapshot.exists()) {
			return false;
		}
		return snapshot.val();
	} catch (error) {
		console.log("err gtDb :" + error);
		return false;
	}
}

export { sndEmail };
