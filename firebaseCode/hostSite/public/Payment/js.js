// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://gstatic.com";
//import { loadStripe } from "https://esm.sh";
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
// تهيئة Firebase
const db = getFirestore(app);
// 2. تهيئة Stripe (استبدل المفتاح بالمفتاح العام الخاص بك من لوحة تحكم Stripe)
// 2. تحميل وتهيئة Stripe للمتصفح بصيغة import (استبدل المفتاح بمفتاحك العام)
//const stripe = Stripe("pk_test_YOUR_STRIPE_PUBLISHABLE_KEY");
const stripe = Stripe("pk_test_51UYap30WcOQ7un3eOLZTrr1iTT6AhTz6Sx07FkTG2pwv9Lmp1R5BVwKGD6mk4745SksH0ssRxCcMn3OHPMCnVR9L00bmaiW8TC");
const elements = stripe.elements();

// إنشاء حقل البطاقة وتنسيقه
const cardElement = elements.create("card", {
  style: {
    base: {
      fontSize: "16px",
      color: "#32325d",
      "::placeholder": { color: "#aab7c4" }
    }
  }
});
cardElement.mount("#card-element");

// التعامل مع أخطاء الإدخال الفورية
cardElement.on("change", (event) => {
  const displayError = document.getElementById("card-errors");
  displayError.textContent = event.error ? event.error.message : "";
});

// 3. عند الضغط على زر الدفع
const form = document.getElementById("payment-form");
const submitButton = document.getElementById("submit-button");
const messageDiv = document.getElementById("payment-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitButton.disabled = true;
  submitButton.textContent = "جاري معالجة الدفع...";

  const cardholderName = document.getElementById("cardholder-name").value;

  try {
    // أ) إضافة طلب دفع جديد في قاعدة بيانات Firestore
    const docRef = await addDoc(collection(db, "payments"), {
      amount: 1900, // المبلغ بالسنت (5000 سنت = 50.00 دولار)
      currency: "usd",
      customerName: cardholderName,
      status: "pending",
      createdAt: new Date()
    });

    // ب) الاستماع للتغييرات في المستند (ينتظر قيام السيرفر بإنشاء client_secret)
    onSnapshot(docRef, async (snap) => {
      const data = snap.data();

      if (data && data.client_secret) {
        // ج) تأكيد الدفع عبر Stripe باستخدام الرمز السري القادم من الخادم
        const { paymentIntent, error } = await stripe.confirmCardPayment(data.client_secret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: cardholderName }
          }
        });

        if (error) {
          document.getElementById("card-errors").textContent = error.message;
          submitButton.disabled = false;
          submitButton.textContent = "ادفع الآن";
        } else if (paymentIntent.status === "succeeded") {
          form.classList.add("hidden");
          messageDiv.classList.remove("hidden");
          messageDiv.classList.add("success");
          messageDiv.textContent = "تمت عملية الدفع بنجاح! رقم العملية: " + paymentIntent.id;
        }
      }
    });

  } catch (err) {
    console.error("Error:", err);
    document.getElementById("card-errors").textContent = "حدث خطأ في الاتصال بالخادم.";
    submitButton.disabled = false;
    submitButton.textContent = "ادفع الآن";
  }
});
