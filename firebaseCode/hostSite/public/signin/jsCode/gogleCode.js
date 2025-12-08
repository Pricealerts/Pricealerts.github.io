// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import {
	getAuth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
	apiKey: "AIzaSyCL11Nbo54WUlFCGN3raQB-AsVWfR2_guM",
	authDomain: "alertprice-c0176.firebaseapp.com",
	databaseURL:
		"https://alertprice-c0176-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "alertprice-c0176",
	storageBucket: "alertprice-c0176.firebasestorage.app",
	messagingSenderId: "48895497565",
	appId: "1:48895497565:web:8b7c5e16335812f6c344b4",
	measurementId: "G-YV336XXHKP",
};

//import { getFunctions, httpsCallable } from "firebase/functions";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();

// ... كود تسجيل الدخول السابق ...

// ----------------- Initialize ----------------
const auth = getAuth(app);

// ----------------- Login Function -----------------
window.loginWithGoogle = function () {
	signInWithPopup(auth, provider)
		.then(result => {
			console.log("User:", result.user);
			window.location.href = "index.html"; // الصفحة التي تريدها
		})
		.catch(err => {
			alert("Error: " + err.message);
		});
};

/* 

document.getElementById("googleBtn").addEventListener("click", () => {
	signInWithPopup(auth, provider)
		.then(async result => {
			// 1. تم تسجيل الدخول بنجاح
			console.log("Logged in!");

			// 2. الآن نستدعي الدالة يدوياً لإنشاء الملف
			const functions = getFunctions();
			const createUserProfile = httpsCallable(functions, "createUserProfile");

			// نرسل البيانات الإضافية التي نريدها
			await createUserProfile({
				userType: "trader", // مثلاً نرسل نوع المستخدم
				phoneNumber: "0555555555",
			});

			console.log("Profile created in Database!");
		})
		.catch(error => {
			console.error("Error:", error);
		});
});
document.getElementById("googleBtn").addEventListener("click", () => {
	signInWithPopup(auth, provider)
		.then(async result => {
			// 1. استخراج الـ ID من نتيجة تسجيل الدخول
			const uid = result.user.uid;

			console.log("Logged in!");
			console.log("My User ID is:", uid); // ✅ هنا يظهر الـ ID

			// 2. الآن نستدعي الدالة يدوياً لإنشاء الملف
			const functions = getFunctions();
			const createUserProfile = httpsCallable(functions, "createUserProfile");

			// نرسل البيانات الإضافية
			// ملاحظة: لا تحتاج لإرسال الـ uid هنا لأن الدالة السحابية تعرفه تلقائياً (context.auth.uid)
			await createUserProfile({
				userType: "trader",
				phoneNumber: "0555555555",
			});

			console.log("Profile created in Database for user:", uid);
		})
		.catch(error => {
			console.error("Error:", error);
		});
});

// 3. تهيئة الزر عند تحميل الصفحة
window.onload = function () {
	google.accounts.id.initialize({
		// ⚠️ هام جداً: استبدل هذا بالكلاينت آيدي الخاص بك
		//
		client_id:
			"200237716010-fsre2cg3a1dgm666mb1qcq6gdhntl2sd.apps.googleusercontent.com",
		callback: handleCredentialResponse,
	}); // nta3 4808 '1764807444546'   nta3 4509 '101949427684476062511'
	gogleRender("buttonSignUp");
	gogleRender("buttonSignIn");

	function gogleRender(btn) {
		google.accounts.id.renderButton(
			document.getElementById(btn),
			{ theme: "outline", size: "large" } // خصائص شكل الزر
		);
	}

	// اختياري: إظهار نافذة التسجيل المنبثقة تلقائياً
	google.accounts.id.prompt();
};

// 2. دالة التعامل مع الاستجابة بعد التسجيل
async function handleCredentialResponse(response) {
	// response.credential هو التوكن المشفر

	// نفك التشفير لاستخراج البيانات
	let responsePayload = parseJwt(response.credential);

	let bodyUp = {
		action: "addAccontGogl",
		userId: responsePayload.sub,
		userName: responsePayload.name, // Full name
		userEmail: responsePayload.email,
		userPicture: responsePayload.picture,
		usergogl: true,
	};
	try {
		const rspns = await ftchFirebase(bodyUp);
		if (rspns.status == "success") {
			const { userId, ...nwbodyUp } = bodyUp;
			for (const key in nwbodyUp) {
				localStorage[key] = nwbodyUp[key];
			}
			saveImage(nwbodyUp.userPicture);
			//bodyUp = {};
			responsePayload.sub = "";
			//window.location.href = drction;
		}
	} catch (error) {}

	//userId = "";
}

// دالة لفك تشفير الـ JWT Token الذي ترجعه جوجل
// هذه الدالة ضرورية لأن جوجل ترسل البيانات مشفرة
function parseJwt(token) {
	var base64Url = token.split(".")[1];
	var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
	var jsonPayload = decodeURIComponent(
		window
			.atob(base64)
			.split("")
			.map(function (c) {
				return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join("")
	);

	return JSON.parse(jsonPayload);
}
 */
