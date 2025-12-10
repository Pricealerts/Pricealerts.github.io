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
			updateUserData(result.user, false);
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
	});

	// 2. رسم الزر داخل الـ div
	google.accounts.id.renderButton(document.getElementById("buttonSignUp"), {
		theme: "outline", // الخيارات: "outline", "filled_blue", "filled_black"
		size: "large", // الخيارات: "large", "medium", "small"
		text: "signin_with", // النص: "signin_with", "signup_with", "continue_with"
		shape: "rectangular", // الشكل: "rectangular", "pill"
		width: "250", // عرض الزر بالبكسل
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

// مراقبة حالة تسجيل الدخول
onAuthStateChanged(auth, user => {
	if (user) {
		console.log("User is signed in:", user);
	} else {
		console.log("User is signed out");
	}
});
// تحديث بيانات المستخدم في Firebase DB
function updateUserData(user, isExst) {
	// استخدام set بدلاً من update
	const id = btoa(user.userEmail);
	const userRef = ref(db, "allAcconts/" + id);
	if (isExst) {
		get(userRef).then(snapshot => {
			if (snapshot.exists()) {
				const { lastLogin, paid, status, userPassword, ...restUsr } =
					snapshot.val();
				for (const key in restUsr) {
					localStorage[key] = restUsr[key];
				}
			} else {
				setData(userRef);
			}
		});
	} else {
		setData(userRef);
	}
}

function setData(userRef) {
	set(userRef, {
		userEmail: user.email,
		lastLogin: new Date().toISOString(),
		userName: user.userName,
		userEmail: user.userEmail,
		userPicture: user.photoURL,
		chtId1: "",
		chtId2: "",
		chtId3: "",
		status: "online",
	}).then(() => {
		document.getElementById("msg").style.color = "green";
		document.getElementById("msg").textContent =
			"تم التسجيل وتعديل البيانات ✔️";
	});
	console.log("الحساب غير موجود في قاعدة البيانات");
}
//sgnOUt();
function sgnOUt() {
	signOut(auth)
		.then(() => {
			console.log("تم تسجيل الخروج بنجاح");
			//alert("تم تسجيل الخروج");
		})
		.catch(error => {
			console.error("خطأ في تسجيل الخروج:", error);
		});
}
export { auth };
