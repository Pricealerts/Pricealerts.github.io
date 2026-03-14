import {
	signOut,
	auth,
	onAuthStateChanged,
	signInWithCredential,
	GoogleAuthProvider,
	signInWithEmailAndPassword, // rah f signin
	/* jiht db */
	db,
	ref,
	update,
	set,
	get,
	/* jiht storag */
	getDownloadURL,
	storageRef,
	storage,
} from "https://pricealerts.github.io/frbsJs/firebaseCode.js";
// إعداد Firebase
// إعدادات Firebase الخاصة بك

// تسجيل الدخول عبر Google

// هذه الدالة ستعمل سواء ضغط المستخدم على الزر أو على النافذة المنبثقة
window.handleCredentialResponse = response => {
	console.log("تم استلام التوكن...");

	// تحويل التوكن لبيانات يفهمها Firebase
	const credential = GoogleAuthProvider.credential(response.credential);

	signInWithCredential(auth, credential)
		.then(async result => {
			// يمكنك هنا الحصول على بيانات المستخدم (مثل الاسم والبريد الإلكتروني)
			let user = result.user;

			console.log("تم تسجيل الدخول بنجاح:", user);

			// تحديث بيانات المستخدم في قاعدة البيانات
			await updateUserData(user, false);
			// إخفاء الزر بعد النجاح (اختياري)
			document.getElementById("buttonSignUp").style.display = "none";
		})
		.catch(error => {
			console.error("Error:", error);
		});
};

window.onload = function () {
	// 1. التهيئة (مشتركة للزر والنافذة)
	google.accounts.id.initialize({
		client_id:
			"200237716010-fsre2cg3a1dgm666mb1qcq6gdhntl2sd.apps.googleusercontent.com", // لا تنس تغيير هذا
		callback: handleCredentialResponse,
		auto_select: false,
		cancel_on_tap_outside: false,
		// 👇 أضف هذا السطر لتمكين FedCM
		use_fedcm_for_logins: true,
	});
	// 2. رسم الزر داخل الـ div
	google.accounts.id.renderButton(document.getElementById("buttonSignUp"), {
		theme: "outline",
		size: "large",
		text: "signin_with",
		shape: "rectangular",
		width: "250",
	});
	google.accounts.id.renderButton(document.getElementById("buttonSignIn"), {
		theme: "outline", // الخيارات: "outline", "filled_blue", "filled_black"
		size: "large", // الخيارات: "large", "medium", "small"
		text: "signin_with", // النص: "signin_with", "signup_with", "continue_with"
		shape: "rectangular", // الشكل: "rectangular", "pill"
		width: "250", // عرض الزر بالبكسل
	});
	// 3. إظهار النافذة المنبثقة (One Tap) أيضاً
	google.accounts.id.prompt(notification => {
		if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
			console.log(
				"النافذة لم تظهر (ربما بسبب إغلاقها سابقاً أو إعدادات المتصفح)"
			);
		}
	});
};

// تحديث بيانات المستخدم في Firebase DB
let iLoup = 0;
async function updateUserData(user, isExist = true) {
	iLoup++;
	try {
		const userRef = ref(db, "users/" + user.uid);
		await get(userRef).then(async snapshot => {
			const snp = snapshot.exists();
			if (snp) {
				const { lastLogin, paid, status, ...restUsr } = snapshot.val();
				for (const key in restUsr) {
					localStorage[key] = restUsr[key];
				}
				await update(userRef, {
					lastLogin: new Date().toISOString(),
					status: "online",
				}).then(() => {
					console.log("تم التسجيل وتعديل البيانات ✔️");
				});
			} else {
				if (isExist) {
					setTimeout(async () => {
						if (iLoup < 3) {
							await updateUserData(user);
							console.log("rah ydor : " + iLoup);
						} else {
							alert("حدث خطأ أعد المحاولة ✔️");
						}
					}, 2000);
				} else {
					await setData(userRef, user);
				}
			}
		});

		let imgUrl = user.photoURL;
		if (
			imgUrl == "https://pricealerts.web.app/imgs/web/icon-512-maskable.png"
		) {
			localStorage.setItem("base64Pctr", imgUrl);
		} else {
			console.log("img url is : " + imgUrl);
			let srcImg = localStorage.userPicture;
			const index = imgUrl.lastIndexOf("=") + 1;
			const newImgUrl =
				index !== -1 ? imgUrl.substring(0, index) + "s300-c" : imgUrl;

			if (srcImg == "frbsStrg") {
				const imgBase64 = await storgImgBase64(user.uid);
				localStorage.setItem("base64Pctr", imgBase64);
			} else {
				await gogleImg(newImgUrl);
			}
		}
		localStorage.nmberPrmpt = 0
		window.location.href = drction;
	} catch (error) {
		console.log("error updateUserData is : " + error);
	}
}

async function setData(userRef, user) {
	const infoUser = {
		userEmail: user.email,
		userName: user.displayName,
		userPicture: "noFrbsStrg",
		chtId1: "",
		chtId2: "",
		chtId3: "",
		paid: false,
		lastLogin: new Date().toISOString(),
		status: "online",
	};
	await set(userRef, infoUser).then(() => {
		for (const key in infoUser) {
			localStorage[key] = infoUser[key];
		}
		console.log("تم  إنشاء البيانات ✔️");
	});
}

// مراقبة حالة تسجيل الدخول
let isPrmrEntr = true;
onAuthStateChanged(auth, async user => {
	if (user && isPrmrEntr) {
		console.log("User is signed in:", user);
	}
	isPrmrEntr = false;
});



async function gogleImg(source) {
	try {
		const img = new Image();
		img.crossOrigin = "anonymous"; // مهم لو الصورة من رابط خارجي

		// استخدم Promise لتحويل event onload إلى عملية غير متزامنة
		const base64 = await new Promise((resolve, reject) => {
			img.onload = function () {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				ctx.drawImage(img, 0, 0);
				const base64Image = canvas.toDataURL("image/png");
				resolve(base64Image); // أعد النتيجة بعد الرسم
			};

			img.onerror = function () {
				reject("فشل تحميل الصورة"); // أعد خطأ إذا فشل التحميل
			};

			img.src = source; // ابدأ تحميل الصورة
		});
		// بعد تحميل الصورة وتحويلها إلى Base64، يمكنك حفظها في localStorage
		localStorage.setItem("base64Pctr", base64);
		console.log("تم حفظ الصورة بنجاح  في locale storg ✔️");
	} catch (error) {
		console.error(error); // التعامل مع الأخطاء في حالة فشل تحميل الصورة
	}
}


async function storgImgBase64(userId) {
	try {
		// إنشاء المرجع للملف
		const avatarRef = storageRef(storage, `avatars/${userId}`);

		// جلب رابط التحميل
		const url = await getDownloadURL(avatarRef);

		// جلب الصورة كـ Blob
		const response = await fetch(url);
		const blob = await response.blob();

		// تحويل Blob إلى Base64
		return await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result); // النتيجة ستكون: "data:image/png;base64,..."
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.error("خطأ في جلب الصورة:", error);
		return null;
	}
}



console.log("hadi jdida 38");

//export { auth };
