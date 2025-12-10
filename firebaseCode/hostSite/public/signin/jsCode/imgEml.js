// دالة لفك تشفير الـ JWT Token الذي ترجعه جوجل
// هذه الدالة ضرورية لأن جوجل ترسل البيانات مشفرة


/* const btnEmail = document.createElement('button')
btnEmail.id = 'buttonSignUp'
const imgEmail = document.createElement('img')
imgEmail.id = 'imgSignUp' */


function parseJwt(token) {
	var base64Url = token.split(".")[1];
	var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
	var jsonPayload = decodeURIComponent(
		window
			.atob(base64)
			.split("")
			.map(function (c) {
				return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join("")
	);
    console.log(jsonPayload);
    
	return JSON.parse(jsonPayload);
}

// 2. دالة التعامل مع الاستجابة بعد التسجيل
function handleCredentialResponse(response) {
	// response.credential هو التوكن المشفر

	// نفك التشفير لاستخراج البيانات
	const responsePayload = parseJwt(response.credential);

	console.log("ID: " + responsePayload.sub);
	console.log("Full Name: " + responsePayload.name);
	console.log("Given Name: " + responsePayload.given_name);
	console.log("Family Name: " + responsePayload.family_name);
	console.log("Image URL: " + responsePayload.picture);
	console.log("Email: " + responsePayload.email);

	// عرض البيانات في الصفحة
	//document.getElementById("userInfo").style.display = "flex";
	localStorage.UserName = responsePayload.name;
	localStorage.UserEmail = responsePayload.email;
	localStorage.UserPicture = responsePayload.picture;
	localStorage.UserId = responsePayload.sub;
	//window.location.href = "https://pricealerts.web.app";
	/* document.getElementById("userName").innerText = responsePayload.name;
				document.getElementById("userEmail").innerText = responsePayload.email;
				document.getElementById("userImage").src = responsePayload.picture; */
}

// 3. تهيئة الزر عند تحميل الصفحة
window.onload = function () {
	google.accounts.id.initialize({
		// ⚠️ هام جداً: استبدل هذا بالكلاينت آيدي الخاص بك
		client_id:
			"200237716010-fsre2cg3a1dgm666mb1qcq6gdhntl2sd.apps.googleusercontent.com",
		callback: handleCredentialResponse,
	});
	gogleRender("buttonSignUp");
	//gogleRender("buttonSignIn");

	function gogleRender(btn) {
		google.accounts.id.renderButton(
			document.getElementById(btn),
			{ theme: "outline", size: "large" } // خصائص شكل الزر
		);
        
	}

	// اختياري: إظهار نافذة التسجيل المنبثقة تلقائياً
	google.accounts.id.prompt();
};
setTimeout(() => {
    
        console.log(document.querySelector('#buttonSignUp '));
}, 1000);

