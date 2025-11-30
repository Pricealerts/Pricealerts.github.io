let UserImage = "/imgs/web/apple-touch-icon.png";
let enteEsc = " تسجبل الدخول";
if (localStorage.UserPicture) {
	UserImage = localStorage.UserPicture;
	enteEsc = " تسجبل الخروج";
}

function exsit() {
	if (localStorage.UserPicture) {
		localStorage.UserName = "";
		localStorage.UserEmail = "";
		localStorage.UserPicture = "";
	}
	window.location.href = "https://pricealerts.web.app/signin/index.html";
}

///////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////

//nta3 navbar saide bar

const sidebar = document.createElement("div");
//sidebar.id = 'sidebar';
sidebar.className = "sidebar";
sidebar.innerHTML = `<!-- Sidebar (LEFT) -->
			<h3>القائمة</h3>
			<a href="https://pricealerts.web.app/">الرئيسية</a>
			<a href="https://pricealerts.web.app/otherPage/about.html">
            من نحن</a>
		<!--
        	<a href="#">المنتجات</a>
			<a href="#">الخدمات</a> 
             -->
			<a href="https://pricealerts.web.app/otherPage/privacy.html">
            سياسة الخصوصية</a>
			<a href="https://pricealerts.web.app/otherPage/contact.html">
            اتصل بنا</a>
			<a style="cursor:pointer"  onclick = "exsit()">
       ${enteEsc}</a>
		




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
