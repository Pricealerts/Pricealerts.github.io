const input = document.getElementById("inputLink");
const btn = document.getElementById("showBtn");
const imgBox = document.getElementById("imgBox");
const msg = document.getElementById("msg");

// استخرج FILE_ID من أي رابط مشاركة Drive أو إذا المستخدَم هو مباشرة ID إرجعها
function extractFileId(inputStr) {
	if (!inputStr) return null;
	// لو المستخدم أعطى فقط ID (طول تقريبي 10-60) نعيدها
	const trimmed = inputStr.trim();
	// محاولات التعرف على صيغ الروابط المختلفة
	const patterns = [
		/\/d\/([a-zA-Z0-9_-]{10,})/, // https://drive.google.com/file/d/FILE_ID/view
		/id=([a-zA-Z0-9_-]{10,})/, // ...?id=FILE_ID
		/open\?id=([a-zA-Z0-9_-]{10,})/, // .../open?id=FILE_ID
		/\/uc\?export=view&id=([a-zA-Z0-9_-]{10,})/, // uc?export=view&id=FILE_ID
		/^([a-zA-Z0-9_-]{10,})$/, // مجرد ID
	];
	for (const re of patterns) {
		const m = trimmed.match(re);
		if (m) return m[1];
	}
	return null;
}

// توليد صيغ مباشرة ممكن تعمل في img.src
function driveUrlsForId(fileId) {
	return [
		`https://drive.google.com/uc?export=view&id=${fileId}`, // شائع لعرض الصور
		`https://drive.google.com/uc?export=download&id=${fileId}`, // أحياناً تعمل بدل view
		`https://drive.google.com/thumbnail?id=${fileId}&sz=w800`, // thumbnail endpoint
	];
}

// جرب وضع صورة مع محاولات بديلة عند الخطأ
function showDriveImage(inputStr) {
	imgBox.innerHTML = "";
	msg.textContent = "جارِ التحميل...";
	imgBox.appendChild(msg);

	const fileId = extractFileId(inputStr + "&export=download");
	if (!fileId) {
		msg.textContent =
			"لم أستطع استخراج FILE_ID من النص المدخل. تأكد من أنك أعطيت رابط مشاركة صحيح أو FILE_ID.";
		return;
	}

	const urls = driveUrlsForId(fileId);
	let idx = 0;
	const img = new Image();
	img.alt = " Image";
	img.onload = () => {
		imgBox.innerHTML = "";
		imgBox.appendChild(img);
	};
	img.onerror = () => {
		idx++;
		if (idx < urls.length) {
			console.log("src is : " + urls[idx]);
			img.src = urls[idx];
		} else {
			// جميع المحاولات فشلت — نعرض رسالة مساعدة
			imgBox.innerHTML = "";
			const el = document.createElement("div");
			el.id = "msg";
			el.style.color = "#c00";
			el.style.padding = "8px";
			el.innerHTML = `
          لم يتم تحميل الصورة. 
        `;
			imgBox.appendChild(el);
		}
	};

	// البداية بعنوان أول رابط
	img.src = urls[0];
}

btn.addEventListener("click", () => {
	showDriveImage(input.value);
});
