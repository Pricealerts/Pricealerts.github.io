import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
//import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging.js";// nta3 tokn
import {
	getAuth,
	onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const firebaseConfig = {
	apiKey: "AIzaSyDIR4H7Jk3bJN_QZp-Cs4CbqpRmsKkUTxc",
	authDomain: "pricealert-31787.firebaseapp.com",
	databaseURL:
		"https://pricealert-31787-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "pricealert-31787",
	storageBucket: "pricealert-31787.firebasestorage.app",
	//"pricealert-31787.appspot.com",
	//"pricealert-31787.firebasestorage.app",
	messagingSenderId: "200237716010",
	appId: "1:200237716010:web:65a9e33254d2302339a953",
	measurementId: "G-L693265WLN",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function gebi(pr) {
	return document.getElementById(pr);
}
let userBr;
let userId;
let emailUser;
onAuthStateChanged(auth, async user => {
	if (user) {
		userBr = user;
		userId = user.uid;
		emailUser = user.email;
		//console.log("fat");
	} else {
		gebi("cntnr").innerHTML = `
		<h2 style="border: none">الدفع الالكترونـــي</h2>
			<div>
				لم تسجل الدخول بعد سيتم تحويلك إلى صفحة تسجيل الدخول بعد
			<span id="cronr">5</span>
		</div> `;
		let crn = 5;
		setInterval(() => {
			crn -= 1;
			gebi("cronr").innerHTML = crn;
			if (crn == 0) window.location.href = "/signin";
		}, 1000);
	}
});
gebi("sndMsg").addEventListener("click", sndMsgs);
async function sndMsgs() {
	let responsP = gebi("respns");
	const option = document.querySelector('input[name="option"]:checked').value;
	const idTransaction = gebi("idTrnsctn").value;
	const allMesage = {
		nameUser: userBr,
		userId: userId,
		emailUser: emailUser,
		option: option,
		idTransaction: idTransaction,
	};
	console.log();

	try {
		const url = "https://rqststocks-wgqzo7cltq-ew.a.run.app";
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "sendMesage",
				smbl: allMesage, //.toUpperCase(),  //smbl ==> message
			}),
		});
		const rslt = await response.json();

		if (rslt.statusMsge == "ok") {
			responsP.innerHTML = "لقد تم ارسال رسالتكم بنجاح نشكركم على المشاركة";
			responsP.style.color = "#008221";
		} else {
			responsP.innerHTML = "لم يتم ارسال الرسالة يرجى إعادة المحاولة";
			responsP.style.color = "#f30909";
		}
		setTimeout(() => {
			responsP.innerHTML = "";
		}, 5000);
	} catch (error) {
		console.error("حدث خطأ " + error);

		responsP.innerHTML = "لم يتم ارسال الرسالة يرجى إعادة المحاولة";
		responsP.style.color = "#f30909";
	}
}
