// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries





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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);



// استيراد الخدمات التي تحتاجها (Storage + Database)
// ملاحظة: نستخدم الروابط المباشرة (CDN) لأنك تعمل على المتصفح
import { getStorage } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// --- ضع بيانات مشروعك هنا ---




// تصدير الخدمات لنستخدمها في الملفات الأخرى
export const storage = getStorage(app);
export const database = getDatabase(app);
export const firebaseApp = app;

