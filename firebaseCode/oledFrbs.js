import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "XXX",
  authDomain: "XXX",
  projectId: "XXX",
  storageBucket: "XXX.appspot.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("avatar").src =
      user.photoURL || "https://via.placeholder.com/120";
  }
});



// ===== تغيير الصورة من Base64 =====
async function updateAvatarFromBase64(base64Image) {
  const user = auth.currentUser;
  if (!user) return alert("يجب تسجيل الدخول");

  const blob = base64ToBlob(base64Image);
  const fileRef = ref(storage, `avatars/${user.uid}.jpg`);

  // رفع الصورة
  await uploadBytes(fileRef, blob);

  // جلب الرابط
  const photoURL = await getDownloadURL(fileRef);

  // تحديث Firebase Auth
  await updateProfile(user, { photoURL });

  // تحديث العرض
  document.getElementById("avatar").src = photoURL;

  alert("تم تغيير الصورة بنجاح ✅");
}
