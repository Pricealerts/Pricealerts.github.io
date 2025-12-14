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

const drction = "../accont";
gebi("frmSgnUp").addEventListener("submit", async (e) => {
	e.preventDefault();
	const acont = document.querySelectorAll("#frmSgnUp input");
	userName = acont[0].value;
	userEmail = acont[1].value;
	userPassword = acont[2].value;
if (!userName || !userEmail || !userPassword) {
		gebi("errmsgsgnUp").innerText = "جميع الحقول مطلوبة";
		gebi("errmsgsgnUp").style.color = "red";
		return false;
	}
	if (userPassword.length < 6) {
		gebi("errmsgsgnUp").innerText = "كلمة المرور يجب أن تكون 6 رموز على الأقل";
		gebi("errmsgsgnUp").style.color = "red";
		return false;
	}
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
gebi("msgCnfrm").addEventListener("submit", async (e) => {
	e.preventDefault();
	console.log("ddd");
	await adedUser();
});
async function adedUser() {
	const codeCnfrm = gebi("codeCnfrm").value;
	if (codeCnfrm.length < 6 || !Number(codeCnfrm)) {
		gebi("errmsgCnfrm").innerText = "رمز التحقق خاطئ أعد المحاولة";
		gebi("errmsgCnfrm").style.color = "red";
		return false;
	}
	gebi("errmsgCnfrm").innerText = "جاري التحقق ...";
	gebi("errmsgCnfrm").style.color = "black";

	const bodyUp = {
		action: "addAccont",
		userName: userName,
		userEmail: userEmail,
		userPassword: userPassword,
		inputCode: codeCnfrm,
		signUp: true,
	};

	const rspns = await ftchFirebase(bodyUp);
	if (rspns.status == "success") {
		await sgnIn("errmsgCnfrm");

	} else if (rspns.status == "overNmber") {
		gebi("errmsgCnfrm").innerText =
			"عدد المحاولات أكثر من اللازم أعد المحاولة بعد ساعة";
		gebi("errmsgCnfrm").style.color = "red";
	}else if (rspns.status == "notExist") {
		gebi("errmsgCnfrm").innerText =
			" رمز التحقق خاطئ أعد المحاولة";
		gebi("errmsgCnfrm").style.color = "red";
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
