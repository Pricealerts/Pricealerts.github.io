import {signInWithPopup,auth,provider,onAuthStateChanged,get,set,signOut} from 'https://pricealerts.github.io/firebaseCode.js';

// تفعيل Google Sign-In
const provider = new GoogleAuthProvider();
// تسجيل الدخول عبر Google
window.signInWithGoogle = async function () {
	signInWithPopup(auth, provider)
		.then(result => {
			// يمكنك هنا الحصول على بيانات المستخدم (مثل الاسم والبريد الإلكتروني)
			const user = result.user;
			console.log("data user is");
			console.log(user.user);

			updateUserData(user, true);
			//const idToken = {action :'verifyIdToken',  result:result.user.getIdToken()};

			// إرسال التوكن إلى Firebase Function للتحقق من الهوية
			// verifyIdToken(idToken);
		})
		.catch(error => {
			console.error("kayn err " + error.message);
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
		gtData(userRef);
	} else {
		setData(userRef);
	}

	
	
}
function gtData(userRef) {
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
			paid: false,
			status: "online",
		}).then(() => {
			document.getElementById("msg").style.color = "green";
			document.getElementById("msg").textContent =
				"تم التسجيل وتعديل البيانات ✔️";
		});
		console.log("الحساب غير موجود في قاعدة البيانات");
	}
sgnOUt();
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
