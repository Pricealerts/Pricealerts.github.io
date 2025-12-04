gebi("frmSgnUp").addEventListener("submit", async e => {
	e.preventDefault();
	const acont = document.querySelectorAll("#frmSgnUp input");
	userName = acont[0].value;
	userEmail = acont[1].value;
	userPassword = acont[2].value;


	gebi("errmsgsgnUp").innerText = "جاري التسجيل ...";
	gebi("errmsgsgnUp").style.color = "black";
	// cnfr cont is exist
	try {
		const rspnsCnfrm = await ftchFirebase({
			action: "cnfrmExist",
			userEmail: userEmail,
		});
		if (rspnsCnfrm.status == "exist") {
			gebi("errmsgsgnUp").innerText =
				"هذا الحساب موجود بالفعل قم بتسجيل الدخول";
			gebi("errmsgsgnUp").style.color = "red";
			setTimeout(() => {
				activateSignIn();
			}, 2000);
			return false;
		}


		// send message
		const data = await ftchAppsScript({
			action: "sndMsgCnfer",
			userEmail: userEmail,
			userName: userName,
		});

		//const apRpond = JSON.parse(data);
		if (data.status == "notSend") {
			gebi("errmsgsgnUp").innerText = "الإيمل خاطئ تأكد منه وأعد المحاولة";
			gebi("errmsgsgnUp").style.color = "red";
			return false;
		}else{
			gebi("msgCnfrm").style.transform = "translateY(0%)";
		}
	} catch (error) {
		console.error("err rspnsCnfrm" + error);
		return false;
	}

	// send message

});

///////////// conferm code
gebi("btnCnfrm").addEventListener("click", async e => {
	await adedUser();
});
async function adedUser() {
  	gebi("errmsgCnfrm").innerText = "جاري التحقق ...";
	gebi("errmsgCnfrm").style.color = "black";
	// conferm send message
	try {
		const data = await ftchAppsScript({
			action: "cnfrmCode",
			userEmail: userEmail,
			inputCode: gebi("codeCnfrm").value,
		});

		if (data.status == "overNmber") {
			gebi("errmsgCnfrm").innerText = "لقد قمت بالمحاولة أكثر من اللازم أعد المحاولة بعد ساعة";
			gebi("errmsgCnfrm").style.color = "red";
		}
		if (data.status == "notExist") {
			gebi("errmsgCnfrm").innerText = "رمز التحقق خاطئ أعد المحاولة";
			gebi("errmsgCnfrm").style.color = "red";
		}
	} catch (error) {
		console.log("error appscript : " + error);
		return false;
	}
	const now = new Date();
	const idUser = now.getTime();
	const body = {
		action: "addAccont",
		userId: idUser,
		userName: userName,
		userEmail: userEmail,
		userPassword: userPassword,
		userPicture: "/imgs/web/apple-touch-icon.png",
		chtId1: "",
		chtId2: "",
		chtId3: "",
		paid: false,
	};

	const rspns = await ftchFirebase(body);
	if (rspns.status == "success") {
		for (const key in body) {
			const element = body[key];
			localStorage[key] = element;
		}
    
		saveImage(body.userPicture);
		window.location.href = "https://pricealerts.web.app/accont";
	}
}

async function ftchFirebase(body) {
	try {
		const urlFirebase =
			"https://europe-west1-pricealert-31787.cloudfunctions.net/proxyRequestV2";
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
		console.error("kayn error :" + error);
	}
}


async function ftchAppsScript(body) {
	
	
	const APP_script_URL ="https://script.google.com/macros/s/AKfycbyPSbiRBdAKQIQiV4eqMZZgb3IM1x_Fp89UPSkCvABNpp4BMOVnRh75_JblSB3Mx0Ls/exec"
		try {
		const apsResponse = await fetch(APP_script_URL, {
			method: "POST",
			body: JSON.stringify(body),
		});

		const data = await apsResponse.json();
		console.log(data);

		return data;
	} catch (error) {
		console.error("error appscript : " + error);
		return false;
	}
}




function runScheduler() {
  const sheet = SpreadsheetApp.getActive().getSheetByName("requests");
  const rows = sheet.getDataRange().getValues();

  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const time = rows[i][0];       // وقت الطلب
    const status = rows[i][2];     // الحالة

    if (status === "pending") {
      const diff = (now - time) / 1000 / 60; // عدد الدقائق

      if (diff >= 60) {
        // نفّذ العملية بعد مرور ساعة
        recalcN(rows[i]);

        // حدّث الحالة
        sheet.getRange(i + 1, 3).setValue("done");
      }
    }
  }
}

