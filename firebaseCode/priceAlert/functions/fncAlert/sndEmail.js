import { chngePswrd, sgnUp, gtEmail } from "./ddauth.js";
import nodemailer from "nodemailer";

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
	const code = Math.floor(100000 + Math.random() * 900000);
	try {
		const emailexsist = await gtEmail(userEmail);
		if (!emailexsist.exists && action == "sndMsgCnferIn")
			return { status: "notexsist" };
		if (emailexsist.exists && action == "sndMsgCnfer")
			return { status: "exist" };
		const bodySnd = {
			action: "sndMsgCnfer",
			userEmail: userEmail,
			userName: userName,
			code: code,
		};
		
		/* const WEB_APP_URL = //
			"https://script.google.com/macros/s/AKfycbyPSbiRBdAKQIQiV4eqMZZgb3IM1x_Fp89UPSkCvABNpp4BMOVnRh75_JblSB3Mx0Ls/exec"; // رابط apps script

		const response = await fetch(WEB_APP_URL, {
			method: "POST",
			// headers: { "Content-Type": "application/json" },
			body: JSON.stringify(bodySnd),
		}); 

		const result = await response.json();*/
		const result = await sndEmailToUser(bodySnd);
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
						await createdUser(auSignUp.user);
						return { status: "success" };
					}
					return { status: "mabghach ysjl" };
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
		return { status: "KHRJ GA3" };
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
async function createdUser(data) {
	const infoUser = {
		userEmail: data.email,
		userName: data.displayName,
		userPicture: data.photoURL,
		chtId1: "",
		chtId2: "",
		chtId3: "",
		paid: false,
		/* 	lastLogin: new Date().toISOString(),
		status: "online", */
	};
	await db.ref(`users/${data.uid}`).set(infoUser);
}

// رسال الإيميلات باستخدام Nodemailer
const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_PASSWORD;


// إعداد Nodemailer مرة واحدة
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: gmailEmail,
		pass: gmailPassword,
	},
});
// Firebase Function (Gen 2)
async function sndEmailToUser(bodySnd) {
	const { userEmail, userName, code/* , text  */} = bodySnd;

	if (!userEmail) {
		 console.log("البريد الإلكتروني مطلوب");
		return { status: "error", message: "البريد الإلكتروني مطلوب" };
	}
	const msgSend = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color:#1a73e8;">مرحباً ${userName} 👋</h2>
      <p>نشكرك لتسجيلك معنى في تطبيق منبه الأسعار .</p>
      <p>رمز التحقق الخاص بك هو:</p>
      <h1 style="color:#1a73e8;">${code}</h1>
      <p>أدخل هذا الرمز في التطبيق لتأكيد بريدك الإلكتروني.</p>
      <hr style="border:none; border-top:1px solid #ddd; margin-top:20px;" />
      <p style="font-size:12px; color:#777;">
        إذا لم تطلب هذا، يمكنك تجاهل الرسالة.
      </p>
    </div>
  `;
	await transporter.sendMail({
		from: `PriceAlerts <${gmailEmail}>`,
		to: userEmail,
		subject: "تأكيد بريدك الإلكتروني",
		//text: text || "",
		html: msgSend,
	});

	return {
		status: "success",
		success: true,
		message: "📧 تم إرسال الإيميل بنجاح",
	};
}

export { sndEmail };
