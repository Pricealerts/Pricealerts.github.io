 // 1. استيراد الدوال اللازمة من مكتبة Firebase
    	// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

    import { 
        getAuth, 
        signInWithEmailAndPassword, 
        createUserWithEmailAndPassword, 
        signInWithPopup, 
        GoogleAuthProvider,
        onAuthStateChanged 
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

 // Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDIR4H7Jk3bJN_QZp-Cs4CbqpRmsKkUTxc",
  authDomain: "pricealert-31787.firebaseapp.com",
  databaseURL: "https://pricealert-31787-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pricealert-31787",
  storageBucket: "pricealert-31787.firebasestorage.app",
  messagingSenderId: "200237716010",
  appId: "1:200237716010:web:65a9e33254d2302339a953",
  measurementId: "G-L693265WLN"
};

import { getFunctions, httpsCallable } from "firebase/functions";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
    const provider = new GoogleAuthProvider();

// ... كود تسجيل الدخول السابق ...

document.getElementById('googleBtn').addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then(async (result) => {
            // 1. تم تسجيل الدخول بنجاح
            console.log("Logged in!");

            // 2. الآن نستدعي الدالة يدوياً لإنشاء الملف
            const functions = getFunctions();
            const createUserProfile = httpsCallable(functions, 'createUserProfile');

            // نرسل البيانات الإضافية التي نريدها
            await createUserProfile({ 
                userType: "trader", // مثلاً نرسل نوع المستخدم
                phoneNumber: "0555555555" 
            });

            console.log("Profile created in Database!");
        })
        .catch((error) => {
            console.error("Error:", error);
        });
});
document.getElementById('googleBtn').addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then(async (result) => {
            // 1. استخراج الـ ID من نتيجة تسجيل الدخول
            const uid = result.user.uid; 
			
            
            console.log("Logged in!");
            console.log("My User ID is:", uid); // ✅ هنا يظهر الـ ID

            // 2. الآن نستدعي الدالة يدوياً لإنشاء الملف
            const functions = getFunctions();
            const createUserProfile = httpsCallable(functions, 'createUserProfile');

            // نرسل البيانات الإضافية
            // ملاحظة: لا تحتاج لإرسال الـ uid هنا لأن الدالة السحابية تعرفه تلقائياً (context.auth.uid)
            await createUserProfile({ 
                userType: "trader",
                phoneNumber: "0555555555" 
            });

            console.log("Profile created in Database for user:", uid);
        })
        .catch((error) => {
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
		usergogl :true
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
