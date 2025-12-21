import {
	auth,
	onAuthStateChanged,
	db,
	ref,
	update,
	updateProfile,
	storage,
	storageRef,
	uploadBytes,
	getDownloadURL,
} from "https://pricealerts.github.io/firebaseCode.js";
const WEB_APP_URL =
	"https://script.google.com/macros/s/AKfycbzAoBdBnx3by3AwPW2H1zZQtGEVNiYux1DlVAj47Zz6hrTqORan378zeyDycwLXXZLJTA/exec"; // رابط apps script
let userId;
let userBr;
onAuthStateChanged(auth, async user => {
	if (user) {
		userBr = user;
		userId = user.uid;
	} else {
			window.location.href = "/signin";
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

	if (file) {
		// ===== تغيير الصورة من Base64 =====


		
		if (!userBr) return alert("يجب تسجيل الدخول");

		const blob = base64ToBlob(file);

		const fileRef = storageRef(storage, `avatars/${userBr.uid}`);

		// رفع الصورة
		await uploadBytes(fileRef, blob);

		// جلب الرابط
		const photoURL = await getDownloadURL(fileRef);

		// تحديث Firebase Auth
		await updateProfile(userBr, { photoURL });

		// تحديث العرض
		//document.getElementById("avatar").src = photoURL;

		console.log("تم تغيير الصورة بنجاح ✅");

		/* 
		 let base64 = file.split(",")[1]; // 7ta file rah base64
		const imgName = userId || new Date().getTime().toString();
		// إرسال الصورة عبر fetch
		const response = await fetch(WEB_APP_URL, {
			method: "POST",
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
		} */
		bodySet.userPicture = photoURL;
		localStorage.base64Pctr = file; //  base64
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

// ===== تحويل Base64 إلى Blob =====
function base64ToBlob(base64) {
	const parts = base64.split(",");
	const mime = parts[0].match(/:(.*?);/)[1];
	const binary = atob(parts[1]);
	const array = [];

	for (let i = 0; i < binary.length; i++) {
		array.push(binary.charCodeAt(i));
	}

	return new Blob([new Uint8Array(array)], { type: mime });
}

/* 
function toBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result.split(",")[1]);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}


base64 = base64.replace(/^data:image\/(png|jpeg);base64,/, "");
reader.result.split(",")[1]
 */
console.log('hadi jdida 4');

