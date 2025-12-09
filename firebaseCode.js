import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	onAuthStateChanged,
	signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
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
const auth = getAuth(app);
const database = getDatabase(app);
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
}
export {
	getAuth,
	signInWithPopup,
	signOut,
	ref,
	update,
	set,
	get,
	auth,
	database,
	setUpdtData,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	GoogleAuthProvider
};
