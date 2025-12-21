import { auth, storage } from './firebaseCode.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

async function getAvatarBase64(userId) {
  try {
    // المرجع للملف في Storage
    const avatarRef = storageRef(storage, `avatars/${userId}`);
    
    // جلب رابط التحميل
    const url = await getDownloadURL(avatarRef);
    
    // جلب الصورة كـ Blob
    const response = await fetch(url);
    const blob = await response.blob();
    
    // تحويل Blob إلى Base64
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // "data:image/png;base64,..."
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("خطأ في جلب الصورة:", error);
    return null;
  }
}

// عند تسجيل الدخول
onAuthStateChanged(auth, async user => {
  if (user) {
    const base64Img = await getAvatarBase64(user.uid);
    if (base64Img) {
      console.log("Base64:", base64Img);

      // عرض الصورة على الصفحة
      const imgElement = document.getElementById("avatar");
      imgElement.src = base64Img;

      // حفظ الصورة في LocalStorage
      localStorage.setItem("avatarBase64", base64Img);
    }
  } else {
    console.log("لم يتم تسجيل الدخول");
  }
});

export { getAvatarBase64 };


