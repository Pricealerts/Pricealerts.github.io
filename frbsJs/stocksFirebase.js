import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { db as dbPrc } from "./firebaseCode.js";
//import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-messaging.js";// nta3 tokn

import {
	getDatabase,
	ref,
	get,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

const firebaseConfig = {
	apiKey: "AIzaSyBHBJPf-oqcI5smvfs77qpsAQVi-gdPUzA",
	authDomain: "hostsite-80e14.firebaseapp.com",
	databaseURL:
		"https://hostsite-80e14-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "hostsite-80e14",
	storageBucket: "hostsite-80e14.firebasestorage.app",
	messagingSenderId: "223122211424",
	appId: "1:223122211424:web:cb10b818701c856d2e7905",
	measurementId: "G-6GG9QT0ZCX",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.gtDataStocks = async exchangeId => {
	try {
		const rslt = (await get(ref(db, `${exchangeId}`))).val();
		console.log(rslt);
		
		return rslt;
	} catch (error) {
		console.log(error);
		return [];
	}
};
window.dataAlrts = async chId => {
	try {
		const rslt = (await get(ref(dbPrc, `alerts/cht${chId}`))).val();
		return rslt;
	} catch (error) {
		console.log(error);
		return [];
	}
};
