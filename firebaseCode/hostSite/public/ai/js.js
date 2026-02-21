import { GoogleGenerativeAI } from "@google/generative-ai";
const urlprcAlrt = "https://rqststocks-wgqzo7cltq-ew.a.run.app";
const urlGtPrice = "https://rqststocks-yg7soqqfkq-ew.a.run.app";

// ---------------------------------------------------------
// 1. الإعدادات (ضع مفتاحك هنا)
// ---------------------------------------------------------
const API_KEY_G = await gtApiKey(false, urlGtPrice);

const genAI = new GoogleGenerativeAI(API_KEY_G);
// ---------------------------------------------------------
// 2. تعريف الأداة (Function Definition)
// ---------------------------------------------------------
// نخبر Gemini أن لدينا دالة يمكنه استخدامها
const toolsDefinition = [
	{
		function_declarations: [
			{
				name: "getPrice",
				description:
					"Get the current price of a cryptocurrency or a stock symbol.",
				parameters: {
					type: "OBJECT",
					properties: {
						symbol: {
							type: "STRING",
							description:
								"The ticker symbol (e.g., 'BTC', 'ETH', 'AAPL', 'TSLA').",
						},
						category: {
							type: "STRING",
							description:
								"The type of asset. Must be either 'crypto' or 'stock'.",
						},
					},
					required: ["symbol", "category"],
				},
			},
		],
	},
];

// أسماء النماذج (نبدأ بالأحدث وننتقل للمستقر عند الخطأ)
let currentModelName = "gemini-3-flash-preview";
// إعداد النموذج مع الأدوات
const model = genAI.getGenerativeModel({
	model: currentModelName, // جرب هذا الاسم بدلاً من flash-8b
	tools: toolsDefinition,
	generationConfig: {
		maxOutputTokens: 1000, // لن يتجاوز الرد حوالي 150 كلمة
	},
});
// model: gemini-flash-latest // ايلا كان عندي بروبلام في version
// إنشاء جلسة محادثة (Chat Session)
const chat = model.startChat({ history: [] });

// ---------------------------------------------------------
// 3. الدالة الحقيقية (تنفيذ الكود الخاص بك)
// ---------------------------------------------------------

// هذه الدالة الجامعة التي طلبتها
async function getPrice(symbol, category) {
	console.log(`جاري جلب السعر لـ: ${symbol} من نوع ${category}`);

	// محاكاة الروابط التي ذكرتها (لأنني لا أملك الروابط الحقيقية)
	// قم بفك التعليق عن كود الـ fetch وضبط الرابط الحقيقي

	let price = 0;
	let currency = "USD";

	try {
		if (category === "crypto") price = await cryptocompare(symbol);
		else if (category === "stock") {
			const rspns = await fetch("https://rqststocks-yg7soqqfkq-ew.a.run.app", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "gtPr", smbl: symbol }),
			});
			const data = await rspns.json();
			// (محاكاة للبيانات)
			price = data.price;
			currency = data.currency;
		}

		return {
			symbol: symbol,
			price: price,
			currency: currency,
			status: "success",
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return { error: "Failed to fetch price" };
	}
}

// خريطة لتنفيذ الدوال بناءً على الاسم القادم من Gemini
const functions = {
	getPrice: ({ symbol, category }) => getPrice(symbol, category),
};

// ---------------------------------------------------------
// 4. منطق المحادثة والواجهة (UI Logic)
// ---------------------------------------------------------
// @ts-ignore
window["sendMessage"] = async () => {
	const inputField = document.getElementById("user-input");
	const userText = inputField.value.trim();
	if (!userText) return;

	// إضافة رسالة المستخدم للشاشة
	addMessage(userText, "user-msg");
	inputField.value = "";

	// إظهار "جاري الكتابة..."
	const loadingDiv = addMessage("جاري الرد...", "loading");

	try {
		// 1. إرسال الرسالة إلى Gemini
		const result = await chat.sendMessage(userText);
		const response = await result.response;

		// 2. التحقق مما إذا كان Gemini يطلب تنفيذ دالة
		const functionCalls = response.functionCalls();

		if (functionCalls && functionCalls.length > 0) {
			// Gemini يريد سعراً!
			const call = functionCalls[0];
			const functionName = call.name;
			const args = call.args;

			// تنفيذ الدالة محلياً
			const functionResponse = await functions[functionName](args);

			// عرض ملاحظة صغيرة للمستخدم (اختياري)
			loadingDiv.innerText = `🔄 جلب بيانات ${args.symbol}...`;

			// 3. إرسال نتيجة الدالة إلى Gemini مرة أخرى
			const result2 = await chat.sendMessage([
				{
					functionResponse: {
						name: functionName,
						response: functionResponse,
					},
				},
			]);

			// الحصول على الرد النهائي
			const finalResponse = await result2.response;
			loadingDiv.remove();
			addMessage(finalResponse.text(), "bot-msg");
		} else {
			// رد نصي عادي (لا يحتاج أسعار)
			loadingDiv.remove();
			addMessage(response.text(), "bot-msg");
		}
	} catch (error) {
		console.error("حدث خطأ:", error);

		// --- ميزة التبديل التلقائي (Fallback) ---
		if (currentModelName !== "gemini-1.5-flash") {
			console.warn(
				"⚠️ النموذج الحالي غير متوفر، يتم التحويل إلى النسخة المستقرة...",
			);
			currentModelName = "gemini-1.5-flash";
			model = genAI.getGenerativeModel({
				model: currentModelName,
				tools: toolsDefinition,
			});
			chat = model.startChat({ history: [] }); // إعادة تهيئة الشات
			loadingDiv.innerText = "🔄 يتم إعادة المحاولة باستخدام نموذج مستقر...";
			window.sendMessage(); // إعادة المحاولة تلقائياً
		} else {
			loadingDiv.remove();
			addMessage(
				"عذراً، تعذر الاتصال بالخدمة. تأكد من مفتاح الـ API أو اتصالك بالإنترنت.",
				"bot-msg",
			);
		}
	}
};

// دوال مساعدة للواجهة
window.sendPrompt = text => {
	document.getElementById("user-input").value = text;
	// window.sendMessage();
};

function addMessage(text, className) {
	const div = document.createElement("div");
	div.className = `message ${className}`;
	// تحويل الماركداون البسيط (Bolding)
	div.innerHTML = text
		.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
		.replace(/\n/g, "<br>");
	document.getElementById("chat-history").appendChild(div);
	document.getElementById("chat-history").scrollTop =
		document.getElementById("chat-history").scrollHeight;
	return div;
}
let apKyCrypto;
async function gtApiKey(apiKey, url) {
	if (!apiKey) {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "gtApiKy" }),
		});
		apiKey = await response.json();
	}
	return apiKey;
}
async function cryptocompare(coin = "BTC", currency = "USDT") {
	apKyCrypto = await gtApiKey(apKyCrypto, urlprcAlrt);
	const url = `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=${currency}&api_key=${apKyCrypto}`;

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error("فشل في جلب البيانات");
		const data = await response.json();
		// الوصول للسعر بناءً على العملة المطلوبة
		const price = data[currency];
		//console.log(`💰 سعر ${coin} الحالي هو: ${price} ${currency}`);
		return price;
	} catch (error) {
		console.error("❌ خطأ:", error);
	}
}
