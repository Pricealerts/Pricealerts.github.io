//import {signInWithPopup,auth,provider,onAuthStateChanged,GoogleAuthProvider,get,set,signOut} from 'https://pricealerts.github.io/firebaseCode.js';

/* 
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
  import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

  // ... باقي الكود
</script> */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	onAuthStateChanged,
	signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
	getDatabase,
	ref,
	update,
	set,
	get,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// إعداد Firebase
// إعدادات Firebase الخاصة بك

const firebaseConfig = {
	apiKey: "AIzaSyDIR4H7Jk3bJN_QZp-Cs4CbqpRmsKkUTxc",
	authDomain: "pricealert-31787.firebaseapp.com",
	databaseURL:
		"https://pricealert-31787-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "pricealert-31787",
	storageBucket: "pricealert-31787.firebasestorage.app",
	messagingSenderId: "200237716010",
	appId: "1:200237716010:web:65a9e33254d2302339a953",
	measurementId: "G-L693265WLN",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
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
