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
	file = e.target.files[0];
	if (!file) {
		return;
	}

	//vrfInpt(gebi("input-file"));
	const reader = new FileReader();
	/* reader.onload = () => {
			image.src = reader.result;
		}; */

	gebi("cntnr").style.display = "block";
	gebi("divplac").classList.add("opPlc");

	reader.onload = function (e) {
		image.src = e.target.result; // تعيين الصورة إلى العنصر img
		// عند تحميل الصورة، نحصل على أبعادها
		image.onload = function () {
			const width = image.width;
			const height = image.height;
			const srclFinl = width > height ? height / 2 : width / 2;
			const nrmlNmbr = srclFinl.toFixed(0);
			const top = (height - nrmlNmbr) / 2;
			setTimeout(() => {
				gebi("cropCircle").style.top = top + "px";
				gebi("cropCircle").style.left = `calc(50% - ${nrmlNmbr / 2}px)`;
				gebi("cropCircle").style.width = nrmlNmbr + "px";
				gebi("cropCircle").style.height = nrmlNmbr + "px";
			}, 100);
			// إظهار الصورة بعد تحميلها
			image.hidden = false;
		};
	};
	reader.readAsDataURL(file);
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
gebi("btnCrop").addEventListener("click", crop);

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
	   ضغط الصورة ≈ 100KB عند الحاجة
	================================ */

	const TARGET_KB = 100;
	const MIN_QUALITY = 0.4;
	const MAX_QUALITY = 0.95;
	const TOLERANCE = 1;

	let minQ = MIN_QUALITY;
	let maxQ = MAX_QUALITY;
	let bestBlob = null;

	// 🔹 نبدأ بتحويل عادي لمعرفة الحجم
	canvas.toBlob(
		originalBlob => {
			const originalSizeKB = originalBlob.size / 1024;

			// ✅ لا ضغط إذا كانت ≤ 100KB
			if (originalSizeKB <= TARGET_KB) {
				finchRslt(originalBlob);
				console.log("بدون ضغط:", Math.round(originalSizeKB), "KB");
				return;
			}

			// ❌ أكبر من 100KB → نبدأ الضغط
			function compress() {
				if (maxQ - minQ < 0.005) {
					if (bestBlob) {
						finchRslt(bestBlob);
						console.log(
							"الحجم النهائي:",
							Math.round(bestBlob.size / 1024),
							"KB"
						);
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
							console.log("محاولة:", Math.round(sizeKB), "KB");
						}

						compress();
					},
					"image/jpeg",
					q
				);
			}

			compress();
		},
		"image/jpeg",
		MAX_QUALITY
	);

	function finchRslt(bestBlob) {
		const url = URL.createObjectURL(bestBlob);
		gebi("base64Pctr").src = url;
		const reader = new FileReader();
		reader.onloadend = function () {
			file = reader.result;
		};
		reader.readAsDataURL(bestBlob);
		gebi("saveBtn").style.backgroundColor = "#007bff";
		gebi("saveBtn").style.cursor = "pointer";
		isChnge = true
	}
}
