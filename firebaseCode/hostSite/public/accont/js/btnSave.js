import {
	auth,
	onAuthStateChanged,
	db,
	ref,
	update,
	signOut,
	updateProfile,
	storage,
	storageRef,
	uploadBytes,
	getDownloadURL,
} from "https://pricealerts.github.io/firebaseCode.js";
// const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzAoBdBnx3by3AwPW2H1zZQtGEVNiYux1DlVAj47Zz6hrTqORan378zeyDycwLXXZLJTA/exec"; // رابط apps script
gebi("sgnOutInLink").addEventListener("click", async () => {
	await onAuthStateChanged(auth, async user => {
		if (user) {
			const userRef = ref(db, "users/" + user.uid);
			await update(userRef, {
				lastLogout: new Date().toISOString(),
				status: "outline",
			});
			await signOut(auth);
		}
		localStorage.clear();
		window.location.href = "/signin";
	});
});
let isChnge = false;
function vrfInpts(el) {
	el.addEventListener("input", () => {
		const newInpts = valInpts();
		if (newInpts != prmyrInpts || file) {
			gebi("saveBtn").style.backgroundColor = "#007bff";
			gebi("saveBtn").style.cursor = "pointer";
            isChnge = true
		} else {
			gebi("saveBtn").style.backgroundColor = "#444";
			gebi("saveBtn").style.cursor = "not-allowed";
            isChnge = false
		}
	});
}

slctAll(".inptSave").forEach(el => vrfInpts(el));

let userId, userBr;
onAuthStateChanged(auth, user => {
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
    if (!isChnge) return false
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
		gebi("chtId1").value.length +
			gebi("chtId2").value.length +
			gebi("chtId3").value.length ==
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
		userName: gebi("userName").innerText || "",
		chtId1: gebi("chtId1").value || "",
		chtId2: gebi("chtId2").value || "",
		chtId3: gebi("chtId3").value || "",
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
		console.log("تم تغيير الصورة بنجاح ✅");
		bodySet.userPicture = "frbsStrg";
		localStorage.base64Pctr = file; //  base64
	}
	for (const key in bodySet) {
		if (localStorage[key] != bodySet[key]) {
			localStorage[key] = bodySet[key];
		}
	}

	try {
		bodySet.userPicturec = "";
		const resUpdate = await updateUserData(bodySet);
		if (resUpdate) {
			gebi("rspns").innerText = "تم الحفظ بنجاح ✅";
			gebi("rspns").style.color = "green";
			setTimeout(() => {
				gebi("rspns").innerText = "";
				window.location.href = "https://pricealerts.web.app";
			}, 3000);
		}
	} catch (error) {
		console.error("حدث خطأ في الرفع:", error);
		gebi("rspns").innerText = "حدث خطأ أعد المحاولة";
		gebi("rspns").style.color = "red";
	}
	file = null;
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

console.log("hadi jdida 7");
