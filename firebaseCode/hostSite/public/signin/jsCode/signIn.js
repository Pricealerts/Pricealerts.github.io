gebi("frmSgnIn").addEventListener("submit", async e => {
	e.preventDefault();
	const acont = document.querySelectorAll("#frmSgnIn input");
	userEmail = acont[0].value;
	userPassword = acont[1].value;
	if (!userEmail.length || !userPassword.length) {
		gebi("errmsgsgnIn").innerText = "عليك ملأ البيانات";
		gebi("errmsgsgnIn").style.color = "red";
		return false;
	}

	const body = {
		action: "getAccont",
		userEmail: userEmail,
		userPassword: userPassword,
	};

	const rspns = await ftchFirebase(body);
	if (rspns.status == "success") {
		const rslt = rspns.rslt;
		for (const key in rslt) {
			localStorage[key] = rslt[key];
		}
		saveImage(localStorage.userPicture);

		window.location.href = "https://pricealerts.web.app/accont";
	} else if (rspns.status == "NoPassword" || rspns.status == "notexsist") {
		gebi("errmsgsgnIn").innerText =
			"  كلمة السر أو الإيميل خاطئ يرجى التأكد من الحساب";
		gebi("errmsgsgnIn").style.color = "red";
	} else {
		console.log("rah flelse");
	}
});



				///////// forget password  msgCnfrmInEmail
gebi('btnCnfrmInEmail').addEventListener("click", async e => {
	//e.preventDefault();
	
	const cntnt = document.querySelectorAll('#msgCnfrmInEmail input');
	 userEmail =  cntnt[0].value;
	gebi("errmsgCnfrmInEmail").innerText = "جاري الإرسال...";
	gebi("errmsgCnfrmInEmail").style.color = "black";
	try {
		const rspnsCnfrm = await ftchFirebase({
			action: "cnfrmExist",
			userEmail: userEmail,
		});
		if (rspnsCnfrm.status != "exist") {
			gebi("errmsgCnfrmInEmail").innerText =
				"هذا الحساب غير موجود";
			gebi("errmsgCnfrmInEmail").style.color = "red";
			setTimeout(() => {
				activateSignUp();
			}, 2000);
			return false;
		}
		
			// send message
		 userName = rspnsCnfrm.userName
			// send message
	
		// send message
		const data = await ftchAppsScript({
			action: "sndMsgCnfer",
			userEmail: userEmail,
			userName: userName,
		});

		//const apRpond = JSON.parse(data);
		if (data.status == "notSend") {
			gebi("errmsgCnfrmInEmail").innerText = "الإيمل خاطئ تأكد منه وأعد المحاولة";
			gebi("errmsgCnfrmInEmail").style.color = "red";
			return false;
		}else{
			gebi("msgCnfrmIn").style.transform = "translateY(0%)";
			gebi("errmsgCnfrmInEmail").innerText = "";
		}
	


	} catch (error) {
		console.log("err rspnsCnfrm" + error);
		return false;
	}
})



/////// btnCnfrmIn
gebi('btnCnfrmIn').addEventListener("click", async e => {
	gebi("errmsgCnfrmIn").innerText = "جاري التحقق ...";
	gebi("errmsgCnfrmIn").style.color = "black";
	// conferm send message
	try {
		const data = await ftchAppsScript({
			action: "cnfrmCode",
			userEmail: userEmail,
			inputCode: gebi("codeCnfrmIn").value,
		});

		if (data.status == "overNmber") {
			gebi("errmsgCnfrmIn").innerText = "لقد قمت بالمحاولة أكثر من اللازم أعد المحاولة بعد ساعة";
			gebi("errmsgCnfrmIn").style.color = "red";
		}
		console.log(data.status);
		
		if (data.status == "notExist") {
			gebi("errmsgCnfrmIn").innerText = "رمز التحقق خاطئ أعد المحاولة";
			gebi("errmsgCnfrmIn").style.color = "red";
		}
		if (data.status == "exist") {
		const rspns = await ftchFirebase(body);

	if (rspns.status == "success") {
		const rslt = rspns.rslt;
		for (const key in rslt) {
			localStorage[key] = rslt[key];
		}
		saveImage(localStorage.userPicture);

		window.location.href = "https://pricealerts.web.app/accont";
	} else {
		gebi("errmsgsgnIn").innerText = "حدث خطأ أعد المحاولة";
		gebi("errmsgsgnIn").style.color = "red";
	}
		}
	} catch (error) {
		console.log("error appscript : " + error);
		return false;
	}
})







