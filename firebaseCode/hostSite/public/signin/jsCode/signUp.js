const lstLoclSrorge = [
	"action",
	"userId",
	"userName",
	"userEmail",
	"userPassword",
	"userPicture",
	"chtId1",
	"chtId2",
	"chtId3",
	"paid",
	"base64Pctr",
];
for (let i = 0; i < lstLoclSrorge.length; i++) {
	const strg = lstLoclSrorge[i];
	localStorage.removeItem(strg);
}

const drction = "../accont/";
gebi("btnSignUp").addEventListener("click", async () => {
	const acont = document.querySelectorAll("#frmSgnUp input");
	userName = acont[0].value;
	userEmail = acont[1].value;
	userPassword = acont[2].value;

	gebi("errmsgsgnUp").innerText = "جاري التسجيل ...";
	gebi("errmsgsgnUp").style.color = "black";
	// cnfr cont is exist
	try {
		const rspnsCnfrm = await ftchFirebase({
			action: "sndMsgCnfer",
			userEmail: userEmail,
			userName: userName,
		});
		if (rspnsCnfrm.status == "exist") {
			gebi("errmsgsgnUp").innerText =
				"هذا الحساب موجود بالفعل قم بتسجيل الدخول";
			gebi("errmsgsgnUp").style.color = "red";
			setTimeout(() => {
				activateSignIn();
			}, 2000);
			return false;
		} else if (rspnsCnfrm.status == "success") {
			gebi("msgCnfrm").style.transform = "translateY(0%)";
		} else if (data.status == "notSend") {
			gebi("errmsgsgnUp").innerText = "الإيمل خاطئ تأكد منه وأعد المحاولة";
			gebi("errmsgsgnUp").style.color = "red";
		} else {
			gebi("errmsgsgnUp").innerText = "حدث خطأ أعد المحاولة";
			gebi("errmsgsgnUp").style.color = "red";
		}
	} catch (error) {
		console.error("err rspnsCnfrm" + error);
		return false;
	}

	// send message
});

///////////// conferm code
gebi("btnCnfrm").addEventListener("click", async () => {
	console.log("ddd");
	await adedUser();
});
async function adedUser() {
	if (gebi("codeCnfrm").value.length < 6) {
		gebi("errmsgCnfrm").innerText = "رمز التحقق خاطئ أعد المحاولة";
		gebi("errmsgCnfrm").style.color = "red";
		return false;
	}
	gebi("errmsgCnfrm").innerText = "جاري التحقق ...";
	gebi("errmsgCnfrm").style.color = "black";
	
	const now = new Date();
	const idUser = now.getTime();
	
	const bodyUp = {
		action: "addAccont",
		userId: idUser,
		userName: userName,
		userEmail: userEmail,
		userPassword: userPassword,
		userPicture: "/imgs/web/apple-touch-icon.png",
		inputCode: gebi("codeCnfrm").value,
		signUp: true,
	};

	const rspns = await ftchFirebase(bodyUp);
	if (rspns.status == "success") {
		const { userPassword, userId,inputCode,signUp, ...newbodyUp } = bodyUp;
		for (const key in newbodyUp) {
			localStorage[key] = newbodyUp[key];
		}
		 sgnIn('errmsgCnfrm' ,true)
		
		
	}
}

async function ftchFirebase(body) {
	try {
		const urlFirebase = 
			"https://europe-west1-pricealert-31787.cloudfunctions.net/proxyRequestV2/";
		const response = await fetch(urlFirebase, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const data = await response.json();
		const rspns = JSON.parse(data);
		console.log(rspns);
		return rspns;
	} catch (error) {
		console.error("kayn error ftchFirebase 115 : " + error);
	}
}





 