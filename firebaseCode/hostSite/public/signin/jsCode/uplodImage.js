
// استيراد storage الجاهزة من ملف الكونفيج
import { storage } from './firebaseConfig.js';
//import { ref, uploadBytes } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

// الآن يمكنك استخدام storage مباشرة دون تهيئتها مرة أخرى
// ... بقية كود الرفع الخاص بك ...

















// 1. استيراد دوال التخزين (Storage)
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

// تهيئة التخزين
const storage = getStorage();

function gebi(el) { return document.getElementById(el); }

// --- كود عرض البيانات القديم ---
// نفترض أن UserImage معرفة لديك مسبقاً أو تأتي من Firestore
gebi("uploadedImage").src = window.UserImage || 'https://via.placeholder.com/150'; 
gebi('userNname').innerText = localStorage.UserName || 'Your Name';
gebi('uerEmail').innerText  = localStorage.UserEmail || 'Your Email';

const inputFile = gebi("input-file");

// --- الاستماع لحدث تغيير الصورة (الرفع) ---
inputFile.addEventListener("change", async e => {
    const file = e.target.files[0];

    if (!file) {
        gebi("errImg").style.display = "block";
        return;
    }

    // 1. المعاينة الفورية (Preview) - لكي يرى المستخدم الصورة فوراً
    const imgCntnt = URL.createObjectURL(file);
    gebi("uploadedImage").src = imgCntnt;
    
    // إخفاء رسالة الخطأ إن وجدت
    gebi("errImg").style.display = "none";


    // 2. عملية الرفع إلى Firebase Storage
    // ---------------------------------------------------------
    
    // هام: يجب أن نستخدم نفس الـ ID الموجود في Realtime DB
    // إذا كنت تخزن الـ ID في localStorage باسم 'UserId' استخدمه
    // إذا لم يكن لديك ID، وتستخدم الاسم فقط (وهذا غير مستحسن لكن ممكن)، استخدم UserName
    const userId = localStorage.UserId || localStorage.UserName; 

    if (!userId) {
        alert("خطأ: لم يتم العثور على هوية المستخدم (ID).");
        return;
    }

    // تحديد المسار: users / [رقم المستخدم] / profile.jpg
    // التسمية الثابتة 'profile.jpg' تعني أن الصورة الجديدة ستبدل القديمة تلقائياً
    const storageRef = ref(storage, `users/${userId}/profile.jpg`);

    try {
        console.log("جاري الرفع إلى السيرفر...");
        
        // تنفيذ الرفع
        await uploadBytes(storageRef, file);
        
        console.log("تم الرفع بنجاح! الـ Function ستقوم بالباقي.");
        
        // (اختياري) يمكنك إظهار رسالة صغيرة للمستخدم
        // alert("تم حفظ صورتك الجديدة");
        
    } catch (error) {
        console.error("حدث خطأ أثناء الرفع:", error);
        alert("فشل رفع الصورة، تأكد من اتصال الإنترنت.");
    }
    
    // إعادة التركيز كما في كودك الأصلي
   // if(gebi("contentToPdf")) gebi("contentToPdf").focus();
});