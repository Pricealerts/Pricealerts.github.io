import {
	signOut,
	auth,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signInWithCredential,
	GoogleAuthProvider,
	/* jiht db */
	db,
	ref,
	update,
	set,
	get,
} from "https://pricealerts.github.io/firebaseCode.js";
// إعداد Firebase
// إعدادات Firebase الخاصة بك

// تسجيل الدخول عبر Google

// هذه الدالة ستعمل سواء ضغط المستخدم على الزر أو على النافذة المنبثقة
window.handleCredentialResponse = response => {
	console.log("تم استلام التوكن...");

	// تحويل التوكن لبيانات يفهمها Firebase
	const credential = GoogleAuthProvider.credential(response.credential);

	signInWithCredential(auth, credential)
		.then(result => {
			// يمكنك هنا الحصول على بيانات المستخدم (مثل الاسم والبريد الإلكتروني)
			const user = result.user;
			updateUserData(user, false);
			// إخفاء الزر بعد النجاح (اختياري)
			document.getElementById("buttonSignUp").style.display = "none";
		})
		.catch(error => {
			console.error("Error:", error);
		});
};

window.onload = function () {
	// 1. التهيئة (مشتركة للزر والنافذة)
	google.accounts.id.initialize({
		client_id:
			"200237716010-fsre2cg3a1dgm666mb1qcq6gdhntl2sd.apps.googleusercontent.com", // لا تنس تغيير هذا
		callback: handleCredentialResponse,
		auto_select: false,
		cancel_on_tap_outside: false,
		// 👇 أضف هذا السطر لتمكين FedCM
		use_fedcm_for_logins: true,
	});

	// 2. رسم الزر داخل الـ div
	google.accounts.id.renderButton(document.getElementById("buttonSignUp"), {
		theme: "outline",
		size: "large",
		text: "signin_with",
		shape: "rectangular",
		width: "250",
	});
	google.accounts.id.renderButton(document.getElementById("buttonSignIn"), {
		theme: "outline", // الخيارات: "outline", "filled_blue", "filled_black"
		size: "large", // الخيارات: "large", "medium", "small"
		text: "signin_with", // النص: "signin_with", "signup_with", "continue_with"
		shape: "rectangular", // الشكل: "rectangular", "pill"
		width: "250", // عرض الزر بالبكسل
	});

	// 3. إظهار النافذة المنبثقة (One Tap) أيضاً
	google.accounts.id.prompt(notification => {
		if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
			console.log(
				"النافذة لم تظهر (ربما بسبب إغلاقها سابقاً أو إعدادات المتصفح)"
			);
		}
	});
};

// تحديث بيانات المستخدم في Firebase DB
let iLoup = 0;
async function updateUserData(user, isExist = true) {
	iLoup++;
	const userRef = ref(db, "users/" + user.uid);

	await get(userRef)
		.then(snapshot => {
			const snp = snapshot.exists();
			console.log("snapshot.exists() : " + snp);

			if (snp) {
				const { lastLogin, paid, status, ...restUsr } = snapshot.val();
				for (const key in restUsr) {
					localStorage[key] = restUsr[key];
				}
				saveImage(localStorage.userPicture);
				update(userRef, {
					lastLogin: new Date().toISOString(),
					status: "online",
				}).then(() => {
					console.log("تم التسجيل وتعديل البيانات ✔️");
				});
			} else {
				if (isExist) {
					setTimeout(() => {
						if (iLoup < 3) {
							updateUserData(user);
							console.log("rah ydor : " + iLoup);
						} else {
							alert("حدث خطأ أعد المحاولة ✔️");
						}
					}, 2000);
				} else {
					setData(userRef, user);
				}
			}
		})
		.then(() => {
			gebi("accountLink").style.display = "block";
			gebi(
				"accountLink"
			).innerHTML = ` ${localStorage.userName} <img src="${localStorage.base64Pctr}" alt="">`;
			gebi("signOutOrInLink").innerHTML = ` تسجبل الخروج
 	 <img src="/imgs/web/signout-svgrepo-com.svg" alt="">`;
		});
}

function setData(userRef, user) {
	const infoUser = {
		userEmail: user.email,
		userName: user.displayName,
		userPicture: user.photoURL,
		chtId1: "",
		chtId2: "",
		chtId3: "",
		paid: false,
		lastLogin: new Date().toISOString(),
		status: "online",
	};
	set(userRef, infoUser).then(() => {
		for (const key in infoUser) {
			localStorage[key] = infoUser[key];
		}
		saveImage(localStorage.userPicture);
		console.log("تم  إنشاء البيانات ✔️");
		console.log("الحساب غير موجود في قاعدة البيانات");
	});
}

// مراقبة حالة تسجيل الدخول
let isPrmrEntr = true;
onAuthStateChanged(auth, async user => {
	if (user && isPrmrEntr) {
		await sgnOUt(user);
		console.log("User is signed in:", user);
	} 
	isPrmrEntr = false;
});


async function sgnOUt(user) {
	const userRef = ref(db, "users/" + user.uid);
	await update(userRef, {
		lastLogout: new Date().toISOString(),
		status: "outline",
	}).then(() => {
		console.log("تم  تعديل البيانات للخروج✔️");
	});
	await signOut(auth)
		.then(async () => {
			console.log("تم تسجيل الخروج بنجاح");
			localStorage.clear();
		})
		.catch(error => {
			console.error("خطأ في تسجيل الخروج:", error);
		});
}

console.log("hadi jdida 1");

export { auth };
