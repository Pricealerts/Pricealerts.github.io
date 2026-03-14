import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
//import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";// nta3 tokn
import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	onAuthStateChanged,
	signInWithCredential,
	signInWithEmailAndPassword,
	updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
	getDatabase,
	ref,
	update,
	set,
	get,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js"; 

import {
	getStorage,
	uploadBytes,
	getDownloadURL,
	ref as storageRef,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// إعداد Firebase
// إعدادات Firebase الخاصة بك
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
	apiKey: "AIzaSyDIR4H7Jk3bJN_QZp-Cs4CbqpRmsKkUTxc",
	authDomain: "pricealert-31787.firebaseapp.com",
	databaseURL:
		"https://pricealert-31787-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "pricealert-31787",
	storageBucket: "pricealert-31787.firebasestorage.app",
	//"pricealert-31787.appspot.com",
		//"pricealert-31787.firebasestorage.app",
	messagingSenderId: "200237716010",
	appId: "1:200237716010:web:65a9e33254d2302339a953",
	measurementId: "G-L693265WLN",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getDatabase(app);
/* //const provider = new GoogleAuthProvider();
const apdtOrSet = { set: set, updt: update };
function setUpdtData(storUp, rfrnce, user) {
	apdtOrSet[storUp](ref(database, rfrnce), {
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
} */

// ---------------------------------------------------------
// 4. كود الإشعارات (Notification Logic) - الكود الذي سألت عنه
// ---------------------------------------------------------

// يُفضل طلب الإذن أولاً
/*   function requestNotificationPermission() {
            console.log('جاري طلب إذن الإشعارات...');
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('تم منح الإذن.');
                    
                    // 👇 هنا نضع الكود الخاص بك لجلب التوكن
                    getToken(messaging, { 
                        vapidKey: "BIpF2FFuUz-1e8gzQc3lmWR77f6BBXy1ssnPdo_2SXD_8vlWimM473gX5VSbeuv0hir8B10Xc--cQA0Y1Vkdyps" 
                    }).then((currentToken) => {
                        if (currentToken) {
                            console.log("Token:", currentToken);
                            document.getElementById('status-message').innerText += "\n تم جلب توكن الإشعارات بنجاح!";
                            // هنا يجب إرسال التوكن لقاعدة البيانات الخاصة بك لربطه بالمستخدم
                        } else {
                            console.log("No registration token available.");
                        }
                    }).catch((err) => {
                        console.log("An error occurred while retrieving token. ", err);
                    });

                } else {
                    console.log('تم رفض الإذن.');
                }
            });
        }

        // استدعاء دالة طلب الإذن (يمكنك وضعها داخل زر بدلاً من تشغيلها مباشرة)
        requestNotificationPermission();


 */

export {
	initializeApp,
	getAuth,
	signInWithPopup,
	signOut,
	auth,
/* 	setUpdtData, */
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
	updateProfile,
	storage,
	storageRef,
	uploadBytes,
	getDownloadURL,
};
