import {
	auth,
	onAuthStateChanged,
	/* jiht db */
	db,
	ref,
	update,
} from "https://pricealerts.github.io/firebaseCode.js";
const WEB_APP_URL =
	"https://script.google.com/macros/s/AKfycbzAoBdBnx3by3AwPW2H1zZQtGEVNiYux1DlVAj47Zz6hrTqORan378zeyDycwLXXZLJTA/exec"; // رابط apps script

let userId;
onAuthStateChanged(auth, async user => {
	if (user) {
		userId = user.uid;
	} else {
		//	window.location.href = "/signin";
	}
});

gebi("formSave").addEventListener("submit", async e => {
	e.preventDefault();
	gebi("rspns").innerText = "جاري الحفظ ...";
	gebi("rspns").style.color = "black";

	/////////////////////////// jiht limage

	if (gebi("userName").innerText.length < 2) {
		gebi("rspns").innerText = "  خانة الإسم فارغة عليك ملأها ";
		gebi("rspns").style.color = "red";
		setTimeout(() => {
			gebi("rspns").innerText = "";
		}, 15000);
		return false;
	}
	if (
		gebi("telegramChatId1").value.length +
			gebi("telegramChatId2").value.length +
			gebi("telegramChatId3").value.length ==
		0
	) {
		gebi("rspns").innerText = "  لم تسجل أي chat Id ";
		gebi("rspns").style.color = "red";
		setTimeout(() => {
			gebi("rspns").innerText = "";
		}, 5000);
		return false;
	}
	const bodySet = {
		userName: gebi("userName")?.innerText || "",
		chtId1: gebi("telegramChatId1")?.value || "",
		chtId2: gebi("telegramChatId2")?.value || "",
		chtId3: gebi("telegramChatId3")?.value || "",
	};
	// 1 MB = 1,000,000 bytes (تقريبًا)
	const MAX_SIZE = 50 * 1024 * 1.37; // أو 1_000_000
	let base64;
	if (imgUrlSrc) {
		if (file.size > MAX_SIZE) {
			base64 = cmprsImg(imgUrlSrc);
		}
		// تحويل الصورة Base64
		//const base64 = await toBase64(file);

		const idTime = new Date().getTime().toString();
		const imgName = userId || idTime;
		// إرسال الصورة عبر fetch
		const response = await fetch(WEB_APP_URL, {
			method: "POST",
			// headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "postImg",
				image: base64,
				name: imgName,
			}),
		});

		const result = await response.json();
		console.log(result);
		if (result.status != "success") {
			gebi("rspns").innerText = "حدث خطأ في رفع الصورة أعد المحاولة";
			gebi("rspns").style.color = "red";
			setTimeout(() => {
				gebi("rspns").innerText = "";
			}, 15000);
			return false;
		}
		const imgSrc = `https://drive.google.com/thumbnail?id=${result.fileId}&sz=w800`;

		bodySet.userPicture = imgSrc;
		localStorage.base64Pctr = base64;
		//saveImage(imgSrc);
	}

	for (const key in bodySet) {
		localStorage[key] = bodySet[key];
	}

	try {
		const resUpdate = await updateUserData(bodySet);
		if (resUpdate) {
			gebi("rspns").innerText = "تم الحفظ بنجاح";
			gebi("rspns").style.color = "green";
			setTimeout(() => {
				gebi("rspns").innerText = "";
				//window.location.href = "https://pricealerts.web.app";
			}, 3000);
		}
	} catch (error) {
		console.error("حدث خطأ في الرفع:", error);
		gebi("rspns").innerText = "حدث خطأ أعد المحاولة";
		gebi("rspns").style.color = "red";
	}
});

async function updateUserData(bodySet) {
	const userRef = ref(db, "users/" + userId);
	try {
		await update(userRef, bodySet);
		console.log("تم التسجيل وتعديل البيانات ✔️");
		return true;
	} catch (error) {
		console.error("حدث خطأ في التحديث:", error);
		gebi("rspns").innerText = "حدث خطأ أعد المحاولة";
		gebi("rspns").style.color = "red";
		return false;
	}
}

function toBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result.split(",")[1]);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
