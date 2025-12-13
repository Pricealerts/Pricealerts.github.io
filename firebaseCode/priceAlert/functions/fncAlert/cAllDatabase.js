// استيراد مكتبة Firebase Admin SDK
import { getDatabase } from "firebase-admin/database";
//import { object } from "firebase-functions/v1/storage";
import { EXCHANGES_CONFIG } from "./cnstnts.js";
import { checkAndSendAlerts, sendTelegramMessage } from "./srchSmbls.js";
import { sndEmail } from "./sndEmail.js";

//import { sndEmail } from "./sndEmail.js";

let postsRef;
let db;
/**
 * دالة لإضافة تنبيه جديد إلى Realtime Database
 * @param alert - البيانات التي سيتم إضافتها
 */
async function cAllDatabase(data) {
	db = getDatabase();
	//data.uid = btoa(data.userEmail);
	if (!data.userPassword) {
		data.userPassword = "qsfqzrqsqle7610dqsdepllpl";
	}
	if (!data.paid) data.paid = false;
	postsRef = db.ref("alerts");
	try {
		const action = data.action;
		let rspns;
		if (action == "gtAlerts") {
			rspns = await gtAlerts(data);
		} else if (action == "setAlert") {
			rspns = await setAlert(data);
		} else if (action === "dltAlrt") {
			rspns = await dltAlrt(data);
		} else if (
			[
				"sndMsgCnferIn",
				"sndMsgCnfer",
				"addAccont",
				"updtPsw",
				"cnfrmCode",
				"verifyIdToken",
			].includes(action)
		) {
			rspns = await sndEmail(data, db);
		} else if (action == "creatUser") {
			rspns = await createdUser(data);
		}

		return rspns;
	} catch (error) {
		// Throw an Error object for better stack traces and consistency
		throw new Error(
			"حدث خطأ: " + (error && error.message ? error.message : String(error))
		);
	}
}

///////////// function gat alert
async function gtAlerts(data) {
	let dtRspns;
	try {
		if (data.chid == "all") {
			dtRspns = await postsRef.get();
		} else {
			dtRspns = await postsRef.child(`cht${data.chid}`).get();
		}
		if (!dtRspns.exists()) {
			return false;
		}

		return dtRspns.val();
	} catch (error) {
		// Provide an Error object
		throw new Error(
			"حدث خطأ: " + (error && error.message ? error.message : String(error))
		);
	}
}

///// the functions
async function setAlert(data) {
	if (
		!data.id ||
		!data.exchangeId ||
		!data.symbol ||
		!data.targetPrice ||
		!data.telegramChatId ||
		!data.alertCondition
	) {
		throw "الرجاء توفير جميع البيانات المطلوبة لتعيين تنبيه تيليجرام.";
	}
	const alrtAdd = {
		exchangeId: data.exchangeId,
		symbol: data.symbol,
		targetPrice: data.targetPrice,
		alertCondition: data.alertCondition,
		//telegramChatId:data.telegramChatId,
		requestTime: new Date().toLocaleString(),
	};

	const rspns = {};

	try {
		const okUser = await cntctUser(data, alrtAdd);
		if (!okUser.okRspns) {
			return okUser;
		}
		await postsRef.child(`cht${data.telegramChatId}/id${data.id}`).set(alrtAdd);
		rspns.status = "success";
		await checkAndSendAlerts();
		return rspns;
	} catch (error) {
		rspns.status = "notSuccess";
		rspns.message = String(error);
		// make sure we reference the symbol correctly
		console.error(`فشل إرسال إشعار تيليجرام لـ ${alrtAdd.symbol} : `, error);
		return rspns;
	}
}

///////// delet alert
async function dltAlrt(data) {
	let chatId = data.telegramChatId;
	let alrtId = data.id;

	if (alrtId.length == 0) {
		return { status: "error", message: "الرجاء توفير معرف التنبيه للحذف." };
	}

	// Use same key structure used in setAlert: "cht<chatId>/id<alrtId>"
	const ref = postsRef.child(`${chatId}/${alrtId}`);
	try {
		// حذف المرجع الأساسي
		await ref.remove();

		const dtCall = db.ref(`allChatId/${chatId}`);

		// تعديل العداد بطريقة آمنة باستخدام transaction
		if (data.alrtOk) {
			await dtCall.transaction(idChat => {
				if (!idChat) {
					return { counter: 1 }; // إذا لم تكن البيانات موجودة
				}

				idChat.counter = (idChat.counter || 1) + 1;
				return idChat;
			});
		}

		return { status: "success" };
	} catch (error) {
		console.error("❌ خطأ أثناء الحذف:", error);
		throw error;
	}
}

async function cntctUser(data, alrtAdd) {
	const idChat = data.telegramChatId;
	let rspns = {};

	try {
		const callDb = db.ref(`allChatId/cht${idChat}`);
		const getChId = await callDb.get();
		let gtChIdExixst;

		if (!getChId.exists()) {
			let message = `لقد قمت بتعين تنبيه على  ${
				EXCHANGES_CONFIG[alrtAdd.exchangeId].name
			}! 
ل<b> ${alrtAdd.symbol} </b>  
(الشرط: السعر   ${
				alrtAdd.alertCondition === "less_than_or_equal"
					? "أقل من أو يساوي"
					: "أعلى من أو يساوي"
			} ${alrtAdd.targetPrice} )
سيتم تبليغك فور تحقيق الشرط
شكرا`;

			const sendMsg = await sendTelegramMessage(idChat, message);
			if (sendMsg.success) {
				gtChIdExixst = {};
				gtChIdExixst.counter = 0;
				gtChIdExixst.paid = data.paidOrNo;
				await callDb.set(gtChIdExixst);
				//rspns.status = "success";
				rspns.okRspns = true;
			} else {
				rspns.status = "notSuccess";
				rspns.okRspns = false;
				console.error(
					`فشل إرسال في  sendTelegramMessage  لـ ${alrtAdd.symbol} : ${error}`
				);
			}

			return rspns;
		}
		gtChIdExixst = getChId.val();

		if (gtChIdExixst.counter < 5 || gtChIdExixst.paid) {
			rspns.okRspns = true;
		} else if (gtChIdExixst.counter > 100 && !gtChIdExixst.paid) {
			rspns.status = "notPaid";
			rspns.okRspns = false;
		} else {
			rspns = { okRspns: false, status: "errorNotfond" };
			console.error(` خطأ غير معروف لـ ${alrtAdd.symbol} : ${error}`);
		}

		return rspns;
	} catch (error) {
		rspns.status = "notSuccess";
		rspns.okRspns = false;
		console.error(`فشل إرسال في cntctUser    ${alrtAdd.symbol} : ${error}`);
		return rspns;
	}
}

async function createdUser(data) {
	const userEmail = data.email;
	const infoUser = {
		userEmail: userEmail,
		userName: data.displayName,
		userPicture: data.photoURL,
		chtId1: "",
		chtId2: "",
		chtId3: "",
		paid: false,
		lastLogin: new Date().toISOString(),
		status: "online",
	};
	await db.ref(`users/${data.userId}`).set(infoUser);
}
export { cAllDatabase };
