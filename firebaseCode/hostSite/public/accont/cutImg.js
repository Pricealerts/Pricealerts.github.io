const image = document.getElementById("imagePr");
const circle = document.getElementById("cropCircle");
const handle = document.getElementById("resizeHandle");
const canvas = document.getElementById("result");
const ctx = canvas.getContext("2d");

let dragging = false;
let resizing = false;
let startX, startY, startSize;
let startDist = null;

let hiding = () => {
	//gebi('opNew').style.display = "block";
	setTimeout(() => {
		gebi("divplac").className = "dvPlc";
	}, 50);
	setTimeout(() => {
		slctAll(".hidjs").forEach(el => {
			el.style.display = "none";
		});
	}, 450);
};

slctAll(".cler").forEach(el => {
	el.addEventListener("click", hiding);
});
function slctAll(pr) {
	return document.querySelectorAll(pr);
}
gebi("divplac").addEventListener("click", n => {
	n.stopPropagation();
});
//const inputFile = gebi("input-file");
let imgUrlSrc;
let file;

gebi("drop-area").addEventListener("click", e => {
	if (!file) {
		gebi("input-file").click();
		return;
	}
	gebi("cntnr").style.display = "block";
	gebi("divplac").classList.add("opPlc");
});

gebi("input-file").addEventListener("change", async e => {
	/* if (file) {
		return;
	} */
	file = e.target.files[0];
	if (!file) {
		gebi("errImg").style.display = "block";
		return;
	}
	const reader = new FileReader();
	/* reader.onload = () => {
			image.src = reader.result;
		}; */

	gebi("cntnr").style.display = "block";
	gebi("divplac").classList.add("opPlc");
	gebi("errImg").style.display = "none";
	circle.classList.add("trnsCrcl");

	reader.onload = function (e) {
		image.src = e.target.result; // تعيين الصورة إلى العنصر img

		// عند تحميل الصورة، نحصل على أبعادها
		image.onload = function () {
			const width = image.width;
			const height = image.height;
			const srclFinl = width > height ? height / 2 : width / 2;
			// const gjgd = typeOf height
			const nrmlNmbr = srclFinl.toFixed(0);

			gebi("cropCircle").style.width = nrmlNmbr + "px";
			gebi("cropCircle").style.height = nrmlNmbr + "px";

			const mydv = width + " " + height + "  " + nrmlNmbr;
			console.log(mydv);
			//heightElement.textContent = height;

			// إظهار الصورة بعد تحميلها
			image.hidden = false;
		};
	};
	reader.readAsDataURL(file);
	/* imgUrlSrc = URL.createObjectURL(file);
		gebi("uploadedImage").src = imgUrlSrc; */
});

// -------- أدوات مساعدة --------
function point(e) {
	if (e.touches) return e.touches[0];
	return e;
}

function distance(t1, t2) {
	return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

// -------- تحريك --------
circle.addEventListener("mousedown", e => {
	if (e.target === handle) return;
	dragging = true;
	startX = e.clientX - circle.offsetLeft;
	startY = e.clientY - circle.offsetTop;
});

document.addEventListener("mousemove", e => {
	if (!dragging) return;
	circle.style.left = e.clientX - startX + "px";
	circle.style.top = e.clientY - startY + "px";
});

document.addEventListener("mouseup", () => (dragging = false));

// -------- تكبير بالماوس --------
handle.addEventListener("mousedown", e => {
	e.stopPropagation();
	resizing = true;
	startX = e.clientX;
	startSize = circle.offsetWidth;
});

document.addEventListener("mousemove", e => {
	if (!resizing) return;
	let newSize = startSize + (e.clientX - startX);
	newSize = Math.max(80, newSize);
	circle.style.width = circle.style.height = newSize + "px";
});

document.addEventListener("mouseup", () => (resizing = false));

// -------- Pinch Zoom (لمس) --------
circle.addEventListener("touchstart", e => {
	if (e.touches.length === 1) {
		dragging = true;
		startX = e.touches[0].clientX - circle.offsetLeft;
		startY = e.touches[0].clientY - circle.offsetTop;
	}
	if (e.touches.length === 2) {
		startDist = distance(e.touches[0], e.touches[1]);
		startSize = circle.offsetWidth;
	}
});

circle.addEventListener("touchmove", e => {
	e.preventDefault();
	if (e.touches.length === 1 && dragging) {
		circle.style.left = e.touches[0].clientX - startX + "px";
		circle.style.top = e.touches[0].clientY - startY + "px";
	}
	if (e.touches.length === 2) {
		let d = distance(e.touches[0], e.touches[1]);
		let scale = d / startDist;
		let newSize = startSize * scale;
		newSize = Math.max(80, newSize);
		circle.style.width = circle.style.height = newSize + "px";
	}
});

circle.addEventListener("touchend", () => {
	dragging = false;
	startDist = null;
});

// -------- القص --------
function crop() {
	const rect = circle.getBoundingClientRect();
	const imgRect = image.getBoundingClientRect();

	const scaleX = image.naturalWidth / image.width;

	const srcSize = rect.width * scaleX;
	const srcX = (rect.left - imgRect.left) * scaleX;
	const srcY = (rect.top - imgRect.top) * scaleX;

	// حجم الإخراج النهائي
	const OUTPUT_SIZE = 700;

	canvas.width = OUTPUT_SIZE;
	canvas.height = OUTPUT_SIZE;

	ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

	// قص دائري
	ctx.save();
	ctx.beginPath();
	ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
	ctx.clip();

	ctx.drawImage(
		image,
		srcX,
		srcY,
		srcSize,
		srcSize,
		0,
		0,
		OUTPUT_SIZE,
		OUTPUT_SIZE
	);

	ctx.restore();

	/* ===============================
	   ضغط الصورة ≈ 100KB بأعلى جودة
	================================ */

	const TARGET_KB = 100;
	const MIN_QUALITY = 0.4;
	const MAX_QUALITY = 0.95;
	const TOLERANCE = 1;

	let minQ = MIN_QUALITY;
	let maxQ = MAX_QUALITY;
	let bestBlob = null;

	function compress() {
		if (maxQ - minQ < 0.005) {
			if (bestBlob) {
				const url = URL.createObjectURL(bestBlob);
				document.getElementById("uploadedImage").src = url;

				console.log("الحجم النهائي:", Math.round(bestBlob.size / 1024), "KB");

				// 🔹 تحويل إلى Base64
				const reader = new FileReader();
				reader.onloadend = function () {
					const base64 = reader.result;
					file = bestBlob;
					console.log("Base64:");
					console.log(base64);
				};
				reader.readAsDataURL(bestBlob);
			}
			return;
		}

		const q = (minQ + maxQ) / 2;

		canvas.toBlob(
			blob => {
				const sizeKB = blob.size / 1024;

				if (sizeKB > TARGET_KB + TOLERANCE) {
					maxQ = q;
				} else {
					minQ = q;
					bestBlob = blob;
				}

				compress();
			},
			"image/jpeg",
			q
		);
	}

	compress();
}

/* function cmprsImg(imgSrc) {
	const img = imgSrc;
	if (!img.complete) {
		alert("الصورة لم تُحمّل بعد");
		return;
	}

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	// 1️⃣ تصغير الأبعاد
	const MAX_WIDTH = 1200;
	let width = img.naturalWidth;
	let height = img.naturalHeight;

	if (width > MAX_WIDTH) {
		height = height * (MAX_WIDTH / width);
		width = MAX_WIDTH;
	}

	canvas.width = width;
	canvas.height = height;
	ctx.drawImage(img, 0, 0, width, height);

	//  تحويل إلى Base64 مع ضغط
	let quality = 0.9;
	let base64;

	do {
		base64 = canvas.toDataURL("image/jpeg", quality);
		quality -= 0.05;
	} while (base64.length > 50 * 1024 * 1.37 && quality > 0.1);
	// 1.37 تقريب لتحويل Base64 إلى حجم فعلي

	return base64;
	// عرض الصورة
	//document.getElementById("outpotimg").src = base64;

	// عرض النص
	//document.getElementById("base64Output").value = base64;
}
 */