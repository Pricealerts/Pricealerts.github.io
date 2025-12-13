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


	await sgnIn("errmsgsgnIn");
	
});



///////// forget password  msgCnfrmInEmail
gebi("msgCnfrmInEmail").addEventListener("submit", async e => {
	e.preventDefault();

	const cntnt = document.querySelectorAll("#msgCnfrmInEmail input");
	userEmail = cntnt[0].value;
	gebi("errmsgCnfrmInEmail").innerText = "جاري الإرسال...";
	gebi("errmsgCnfrmInEmail").style.color = "black";
	try {
		const rspnsCnfrm = await ftchFirebase({
			action: "sndMsgCnferIn",
			userEmail: userEmail,
		});
		if (rspnsCnfrm.status == "notexsist") {
			gebi("errmsgCnfrmInEmail").innerText = "هذا الحساب غير موجود";
			gebi("errmsgCnfrmInEmail").style.color = "red";
			setTimeout(() => {
				activateSignUp();
			}, 2000);
			return false;
		}

		//const apRpond = JSON.parse(data);
		if (rspnsCnfrm.status == "notsuccess") {
			gebi("errmsgCnfrmInEmail").innerText =
				"الإيمل خاطئ تأكد منه وأعد المحاولة";
			gebi("errmsgCnfrmInEmail").style.color = "red";
			return false;
		} else if (rspnsCnfrm.status == "success") {
			gebi("msgCnfrmIn").style.transform = "translateY(0%)";
			gebi("errmsgCnfrmInEmail").innerText = "";
		} 
	} catch (error) {
		console.log("err rspnsCnfrm" + error);
		return false;
	}
});

/////// btnCnfrmIn
gebi("msgCnfrmIn").addEventListener("submit", async e => {
	e.preventDefault();
	gebi("errmsgCnfrmIn").innerText = "جاري التحقق ...";
	gebi("errmsgCnfrmIn").style.color = "black";
	// conferm send message
	try {
		const data = await ftchFirebase({
			action: "cnfrmCode",
			userEmail: userEmail,
			inputCode: gebi("codeCnfrmIn").value,
			signUp: false,
		});

		if (data.status == "overNmber") {
			gebi("errmsgCnfrmIn").innerText =
				"لقد قمت بالمحاولة أكثر من 4 مرات  أعد المحاولة بعد ساعة";
			gebi("errmsgCnfrmIn").style.color = "red";
			return false;
		}
		if (data.status == "notExist") {
			gebi("errmsgCnfrmIn").innerText = "رمز التحقق خاطئ أعد المحاولة";
			gebi("errmsgCnfrmIn").style.color = "red";
			return false;
		}
		if (data.status == "exist") {
			gebi("errmsgCnfrmIn").innerText = "";
			gebi("newPswrd").style.transform = "translateY(0%)";
			return false;
		}
	} catch (error) {
		console.log("error appscript : " + error);
		return false;
	}
});

/////// btnCnfrmIn
gebi("newPswrd").addEventListener("submit", async e => {
	e.preventDefault();
	gebi("errNewPswrd").innerText = "جاري التحديث ...";
	gebi("errNewPswrd").style.color = "black";
	// conferm send message
	userPassword = gebi("inptNewPswrd").value;
	try {
		const data = await ftchFirebase({
			action: "updtPsw",
			userEmail: userEmail,
			userPassword: userPassword,
		});

		if (data.status == "notExist") {
			gebi("errNewPswrd").innerText = "إيميلك غير موجود أعد انشاء حساب من جديد";
			gebi("errNewPswrd").style.color = "red";
			setTimeout(() => {
				activateSignUp();
			}, 2000);
		}
		if (data.status == "success") {
			await sgnIn("errmsgsgnIn");
		} else {
			gebi("errmsgsgnIn").innerText = "حدث خطأ أعد المحاولة ";
			gebi("errmsgsgnIn").style.color = "red";
			console.error(data.status);
		}
	} catch (error) {
		console.log("error btnNewPswrd : " + error);
		return false;
	}
});

async function sgnIn(msgErr) {
	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			userEmail,
			userPassword
		);
		await updateUserData(userCredential.user);
		userPassword = "";
		window.location.href = drction;
	} catch (error) {
			gebi(msgErr).innerText =
			"  كلمة السر أو الإيميل خاطئ يرجى التأكد من الحساب";
		gebi(msgErr).style.color = "red";
		console.log('err sgnIn is : '+ error);
	}
}
