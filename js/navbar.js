let UserImage = "/imgs/web/apple-touch-icon.png";
let userNameDirction = localStorage.userName || "حسابي";
let enteEsc = ` تسجبل الدخول
 <img src="/imgs/web/signin-svgrepo-com.svg" alt="">`;
let dsplyCont = "display: none;";
if (localStorage.base64Pctr) {
	UserImage = localStorage.base64Pctr;
	enteEsc = ` تسجبل الخروج
 <img src="/imgs/web/signout-svgrepo-com.svg" alt="">`;
	dsplyCont = "display: flex;";
}
let enteEsc2 = `
 حسابي
 <img src=${UserImage} alt="">
 `;

function exsit() {
	if (localStorage.email) {
		localStorage.removeItem("base64Pctr");
	}
	window.location.href = "https://pricealerts.web.app/signin";
}

/* 
width: auto;
    height: 35px;
*/
///////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////

//nta3 navbar saide bar

const sidebar = document.createElement("div");
//sidebar.id = 'sidebar';   #1c274c
sidebar.className = "sidebar";
sidebar.innerHTML = `<!-- Sidebar (LEFT) -->
			<h3>القائمة</h3>
			<a href="https://pricealerts.web.app/">
				الرئيسية
				<img src="/imgs/web/home-alt-1-svgrepo-com.svg" alt="home"></a>
			<a href="https://pricealerts.web.app/otherPage/about.html">
				من نحن
            	<img src="/imgs/web/info-circle-svgrepo-com.svg" alt="inf"></a>

		<!--
        	<a href="#">المنتجات</a>
			<a href="#">الخدمات</a> 
             -->
			<a href="https://pricealerts.web.app/otherPage/privacy.html">
           		سياسة الخصوصية
				<img src="/imgs/web/privacy-svgrepo-com.svg" alt=""></a>
			<a href="https://pricealerts.web.app/otherPage/contact.html">
            اتصل بنا
				<img src="/imgs/web/mail-svgrepo-com.svg" alt="home"></a>
			<a id="signOutOrInLink" style="cursor:pointer"  onclick = "exsit()">
        		${enteEsc}
			</a>
			<a id="accountLink" href="https://pricealerts.web.app/accont"
				style = "${dsplyCont} ">
				${userNameDirction}
				<img src="${UserImage}" alt="">
			</a>
`;

document.body.prepend(sidebar);

const navbar = document.createElement("nav");
navbar.innerHTML = `

<!-- Overlay -->
		<div id="overlay" class="overlay"></div>

		<!-- Navbar -->
		<div class="navbar">
			<img class="imgNavbar" src="${UserImage}" alt="">
				<h1 class="hTitel">
				منبه الأسعار </h1 >

			<div class="nav-title">
				
                <button class="menu-btn" id="openSidebar">☰</button>
			</div>
		</div>


`;
//document.body.prepend(navbar)
document.querySelector(".pirantCntynr").prepend(navbar);

/* nta3 navbar */
//const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const openBtn = document.getElementById("openSidebar");

openBtn.onclick = () => {
	sidebar.classList.add("open");
	overlay.classList.add("show");
};

overlay.onclick = () => {
	sidebar.classList.remove("open");
	overlay.classList.remove("show");
};

/* 

https://lh3.googleusercontent.com/a/ACg8ocIm6um8AyIy5fKgxVSN9SsDq--QbsLf66NK54GxPDJKsk14x68=s200-c

https://lh3.googleusercontent.com/a/ACg8ocIjyWfbbXlsfUWR9x-fkKLDgnKFiO2j0IxnO0z89s2ThPc8nvKoPA=s200-c
*/