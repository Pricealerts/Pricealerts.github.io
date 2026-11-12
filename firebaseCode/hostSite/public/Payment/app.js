import { initializeApp } from "https://gstatic.com";
import { getFirestore, collection, addDoc, onSnapshot } from "https://gstatic.com";

// ضع بيانات مشروعك pricealert-31787 هنا
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// تهيئة Stripe مباشرة بدون import
const stripe = Stripe("pk_test_51UYap30WcOQ7un3eOLZTrr1iTT6AhTz6Sx07FkTG2pwv9Lmp1R5BVwKGD6mk4745SksH0ssRxCcMn3OHPMCnVR9L00bmaiW8TC");
const elements = stripe.elements();

const cardElement = elements.create("card");
cardElement.mount("#card-element");
