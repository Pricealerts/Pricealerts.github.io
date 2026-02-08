// استيراد مكتبة Firebase Admin SDK
import { getDatabase } from "firebase-admin/database";
import { EXCHANGES_CONFIG } from "./cnstnts.js";
import { sendTelegramMessage } from "./srchSmbls.js";
import { sndEmail } from "./sndEmail.js";
//import { price, srchSmbls } from "./yhoCode.js";

//import { sndEmail } from "./sndEmail.js";

let postsRef;
let db;
/**
 * دالة لإضافة تنبيه جديد إلى Realtime Database
 * @param alert - البيانات التي سيتم إضافتها
 */
async function cAllDatabase(data) {
	// ✅ تهيئة القاعدة مرة واحدة فقط عند أول استدعاء (Lazy Init)
	if (!db) db = getDatabase();
	if (!postsRef) postsRef = db.ref("alerts");
	//data.uid = btoa(data.userEmail);

	if (!data.p) data.p = false; // paid
	try {
		const action = data.action;
		let rspns;
		if (action == "gtAlerts") {
			rspns = await gtAlerts(data);
		} else if (action == "setAlert") {
			rspns = await setAlerte(data);
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
		} else if (action === "appscrpt") {
			const promises = data.promises.map(prm => cAllDatabase(prm));
			 await Promise.all(promises);
			rspns = false;
		}/*  else if (action === "smbls") {
			rspns = await price(data);
		} */

		return rspns;
	} catch (error) {
		console.log("error action = " + data.action);

		console.error("❌ Error in cAllDatabase:", error);
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
			return {stat:false};
		}

		return {stat:true,alerts:dtRspns.val()} ;
	} catch (error) {
		// Provide an Error object
		throw new Error(
			"حدث خطأ: " + (error && error.message ? error.message : String(error)),
		);
	}
}

///// the functions
async function setAlerte(data) {
	const rspns = {};
	if (!data.id || !data.e || !data.s || !data.t || !data.tId || !data.c) {
		console.log("الرجاء توفير جميع البيانات المطلوبة لتعيين تنبيه تيليجرام.");
	}
	const alrtAdd = {
		e: data.e, // e بدلاً من exchangeId
		s: data.s, // s بدلاً من symbol
		t: data.t, // t بدلاً من targetPrice
		c: data.c, // c بدلاً من alertCondition
		f: data.f, //f: factorPric,
		//  r: new Date().toLocaleString(), // requestTime
	};
	if (data.mt) alrtAdd.mt = data.mt;
	if (data.e2) alrtAdd.e2 = data.e2;
	try {
		if (data.isAlrd) {
			const message = `🔔 تنبيه سعر ${EXCHANGES_CONFIG[alrtAdd.e].name}!<b>${
				alrtAdd.s
			}</b> بلغت <b>${data.prc}</b> (الشرط: السعر ${
				alrtAdd.c === "l" ? "أقل من أو يساوي" : "أعلى من أو يساوي"
			} ${alrtAdd.t})`;
			await sendTelegramMessage(data.tId, message);
			return { status: "success" };
		}
		const okUser = await cntctUser(data);
		if (!okUser.okRspns) {
			return okUser;
		}
		await postsRef.child(`cht${data.tId}/id${data.id}`).set(alrtAdd);
		rspns.status = "success";
		return rspns;
	} catch (error) {
		rspns.status = "notSuccess";
		rspns.message = String(error);
		// make sure we reference the symbol correctly
		console.error(`فشل تخزين لـ ${data.s} : `, error);
		console.log(error);

		return rspns;
	}
}

///////// delet alert
async function dltAlrt(data) {
	let chatId = data.tId;
	let alrtId = data.id;

	if (alrtId.length == 0) {
		return { status: "error", message: "الرجاء توفير معرف التنبيه للحذف." };
	}

	// Use same key structure used in setAlert: "cht<chatId>/id<alrtId>"
	const ref = postsRef.child(`${chatId}/${alrtId}`);
	try {
		// حذف المرجع الأساسي
		await ref.remove();

		//const dtCall = db.ref(`allChatId/${chatId}`);
		// تعديل العداد بطريقة آمنة باستخدام transaction
		/* if (data.alrtOk) {
			await dtCall.update({
				c: admin.database.ServerValue.increment(1),
			});
		} */

		return { status: "success" };
	} catch (error) {
		console.error("❌ خطأ أثناء الحذف:", error);
		throw error;
	}
}

async function cntctUser(data) {
	const idChat = data.tId;
	let rspns = {};
	try {
		const callDb = db.ref(`allChatId/cht${idChat}`);
		const getChId = await callDb.get();
		let gtChIdExixst;
		if (!getChId.exists()) {
			let message = `لقد قمت بتعين تنبيه على  ${EXCHANGES_CONFIG[data.e].name}! 
				ل<b> ${data.s} </b>  
				(الشرط: السعر   ${data.c === "l" ? "أقل من أو يساوي" : "أعلى من أو يساوي"} ${
					data.tPrc
				} )
				سيتم تبليغك فور تحقيق الشرط
				شكرا`;
			const sendMsg = await sendTelegramMessage(idChat, message);
			if (sendMsg.success) {
				gtChIdExixst = { c: 0 /* //counter */ /* p: data.paidOrNo  */ };
				await callDb.set(gtChIdExixst);
				//rspns.status = "success";
				rspns.okRspns = true;
			} else {
				rspns.status = "notSuccess";
				rspns.okRspns = false;
				rspns.msg = sendMsg;
			}

			return rspns;
		}
		//gtChIdExixst = getChId.val();
		rspns.okRspns = true;
		/* if (gtChIdExixst.c < 100 || gtChIdExixst.p) {
			rspns.okRspns = true;
		} else if (gtChIdExixst.c > 99 && !gtChIdExixst.p) {
			rspns.status = "notPaid";
			rspns.okRspns = false;
		} else {
			rspns = { okRspns: false, status: "errorNotfond" };
		} */
		return rspns;
	} catch (error) {
		rspns.status = "notSuccess";
		rspns.okRspns = false;
		rspns.error = error;
		console.log(`فشل  في cntctUser    ${data.s}  is : ${error}`);
		return rspns;
	}
}

export { cAllDatabase };
