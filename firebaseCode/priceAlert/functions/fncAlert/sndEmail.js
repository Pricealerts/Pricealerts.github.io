
import { chngePswrd, sgnUp, gtEmail  } from "./ddauth.js";

let db;

async function sndEmail(data, dtbs) {
	db = dtbs;
	const action = data.action;
	const userEmail = data.userEmail.toLowerCase();
	let reponse;
	try {
		if (["sndMsgCnferIn", "sndMsgCnfer"].includes(action)) {
			await rmovInArryDb(userEmail);

			reponse = await sendVerificationEmail(userEmail, data.userName, action);
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
// ida kan 3dd lmo7awlat bzaf
async function overNmber(userEmail) {
	try {
		const arr = await gtDb();
		if (!arr) return false;

		const fltr = arr.filter(item => item[0] == userEmail);
		if (fltr.length == 0) return false;
		let data = fltr[0];
		if (data[2] > 5) {
			const now = new Date().getTime();
			const oldTime = data[3];
			const diff = (now - oldTime) / 1000 / 60;
			if (diff >= 60) {
				data[2] = 1;
				let dtSet = arr.filter(item => item[0] != userEmail);
				dtSet.push(data);
				await db.ref("allSndEmails").set(dtSet);
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
async function sendVerificationEmail(userEmail, userName, action) {
	const emailexsist = await gtEmail(userEmail);
	if (!emailexsist.success && action == "sndMsgCnferIn")
		return { status: "notexsist" };
	if (emailexsist.success && action == "sndMsgCnfer")
		return { status: "exist" };

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
			const stDt = [userEmail, code, 1, oldTime, false];
			// append to database
			const arr = await gtDb();
			let arrFnl = [];
			if (arr) arrFnl = arr;
			arrFnl.push(stDt);
			await db.ref(`allSndEmails`).set(arrFnl);
			return { status: "success" };
		}
		return { status: "notsuccess" };
	} catch (error) {
		console.log("error sendVerificationEmail is : " + error);

		return { status: "notsuccess" };
	}
}

async function verifyCode(data) {
	const userEmail = data.userEmail.toLowerCase();
	try {
		let respns = { status: "notExist" }; // by default
		let gtData = await gtDb();
		if (!gtData) return respns;
		let fltr = gtData.filter(item => item[0] == userEmail);
		if (fltr.length > 0) {
			let arow = fltr[0];
			if (arow[1] == data.inputCode) {
				if (data.signUp) {
					await rmovInArryDb(userEmail);
					const auSignUp = await sgnUp(
						userEmail,
						data.userPassword,
						data.userName
					);
					if (auSignUp.status == "success") {
						return { status: "success" };
					}
					return { status: "notExist" };
				}

				arow[4] = true;
				respns = { status: "success" };
			}
			arow[2] = arow[2] + 1;
			arow[3] = new Date().getTime(); // oled time
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
	const userEmail = data.userEmail.toLowerCase();
	try {
		let gtData = await gtDb();
		if (!gtData) return { status: "notSucsus" };
		let fltr = gtData.filter(item => item[0] == userEmail);
		if (fltr.length == 0) return { status: "notSucsus" };
		const data2 = fltr[0];
		if (data2[4]) {
			// حذف القيمة "abdou"
			await rmovInArryDb(userEmail);
			const updt = await chngePswrd(userEmail, data.userPassword);
			if (!updt) return { status: "notSuccess" };
			return { status: "success" };
		}
		return { status: "notSuccess" };
	} catch (error) {
		console.log(" error updtPsw is: " + error);

		return { status: "notexsist", message: "not exist email" };
	}
}
async function rmovInArryDb(userEmail) {
	let arr = await gtDb();

	if (arr) {
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
