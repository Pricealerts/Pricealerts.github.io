// استيراد مكتبة Firebase Admin SDK
import { getDatabase } from "firebase-admin/database";
import { sendTelegramMessage } from "./srchSmbls.js";
import {EXCHANGES_CONFIG } from "./cnstnts.js"

let postsRef;
let db ;
/**
 * دالة لإضافة تنبيه جديد إلى Realtime Database
 * @param {object} alert - البيانات التي سيتم إضافتها
 */
async function cAllDatabase(data) {
	db = getDatabase();
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
		}
		return rspns;
	} catch (error) {
		throw "حدث خطأ  :" + error;
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
		throw "حدث خطأ  :" + error;
	}
}




///// the functions
async function setAlert(data) {
	let result;

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
	const rspns ={};
	try {

	const getAllChId = await db.ref(`allChatId`).get();
	//console.log('gtChIdExixst is'+ gtChIdExixst);
	const gtChIdExixst = getAllChId.val();
		
	if (gtChIdExixst.indexOf(data.telegramChatId) == -1) {
		let message = `لقد قمت بتعين تنبيه على  ${  EXCHANGES_CONFIG[alrtAdd.exchangeId].name  }! 
ل<b> ${alrtAdd.symbol} </b> , (الشرط: السعر   ${ alrtAdd.alertCondition === "less_than_or_equal"? "أقل من أو يساوي"  : "أعلى من أو يساوي"  } ${alrtAdd.targetPrice} )
سيتم تبليغك فور تحقيق الشرط
شكرا`;
		
		
		
		
		let sendMsg = await sendTelegramMessage(data.telegramChatId, message);
		if (sendMsg.success) {
			gtChIdExixst.push(data.telegramChatId);
			await db.ref(`allChatId`).set(gtChIdExixst);
		}else {
			rspns.status = 'notSuccess';
			rspns.message = 
			console.error(`فشل إرسال في if elseإشعار تيليجرام لـ ${alrtAdd.symbol}:`, rspns);
			return rspns
		}

	}

	
	
		result = await postsRef
			.child(`cht${data.telegramChatId}/id${data.id}`)
			.set(alrtAdd);
		 rspns.status= "success" ;
		return rspns;
	} catch (error) {
		rspns.status = 'notSuccess';
			rspns.message = error;
			console.error(`فشل إرسال إشعار تيليجرام لـ ${symbol}:`, error);
			return rspns
	}
}

///////// delet alert
async function dltAlrt(data) {
	let chatId = data.telegramChatId;
	let alrtId = data.id;

	if (!alrtId) {
		result.status = "error";
		result.message = "الرجاء توفير معرف التنبيه للحذف.";
		returnresult;
	}

	const ref = postsRef.child(`${chatId}/${alrtId}`);

	try {
		await ref.remove();
		return { status: "success" };
	} catch (error) {
		console.error("❌ خطأ أثناء الحذف:", error);
		throw { error: error };
	}
}
export { cAllDatabase, dltAlrt, gtAlerts };
