
let UserImage =localStorage.base64Pctr || "/imgs/web/apple-touch-icon.png";
let accont = "";

let enteEsc =	`<a  id="signOutLink" style="cursor:pointer" href="https://pricealerts.web.app/signin" >
        			تسجبل الدخول
 					<img src="/imgs/web/signin-svgrepo-com.svg" alt="">
				</a> `;

if (localStorage.base64Pctr) {
	enteEsc = ``;
	accont = `<a id="accountLink" class="accountBtn" href="https://pricealerts.web.app/accont">
				${localStorage.userName || "حسابي"}
				<img src="${UserImage}" alt="img" style="width: auto">
			 </a>`;
}

function exsit() {
	if (localStorage.email) {
		localStorage.removeItem("base64Pctr");
	}
	window.location.href = "https://pricealerts.web.app/signin";
}

/* 

<a  id="signOutLink" style="cursor:pointer" href="https://pricealerts.web.app/signin" >
	تسجبل الخروج
	<img src="/imgs/web/signout-svgrepo-com.svg" alt="">
</a>
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
		
        		${enteEsc}
			
			${accont}
`;

document.body.prepend(sidebar);

const navbar = document.createElement("nav");
navbar.innerHTML = `

<!-- Overlay -->
		<div id="overlay" class="overlay"></div>

		<!-- Navbar -->
		<div class="navbar">
			<a href="https://pricealerts.web.app" style= "height: 100%; display: flex; align-items: center;">
				<img id="imgNavbar" class="imgNavbar" src="${UserImage}" alt="">
			</a>
			<h1 class="hTitel">
				منبه الأسعار 
			</h1 >
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


