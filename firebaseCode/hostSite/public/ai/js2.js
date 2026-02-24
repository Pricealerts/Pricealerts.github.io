import { GoogleGenerativeAI } from "@google/generative-ai";
import {
	addMessage,
	chat,
	functions,
	currentModelName,
	model,
	genAI,
	toolsDefinition,
} from "./js";

// ==========================================
// 1. الإعدادات والتهيئة
// ==========================================
const API_KEY = "ضع_مفتاحك_هنا";
const genAI = new GoogleGenerativeAI(API_KEY);

// أسماء النماذج (نبدأ بالأحدث وننتقل للمستقر عند الخطأ)
let currentModelName = "gemini-3-flash-preview";

// ==========================================
// 2. تعريف الأدوات (Function Declarations)
// ==========================================
const toolsDefinition = [
	{
		functionDeclarations: [
			{
				name: "getPrice",
				description: "جلب السعر المباشر للعملات الرقمية أو الأسهم العالمية.",
				parameters: {
					type: "OBJECT",
					properties: {
						symbol: {
							type: "STRING",
							description: "رمز العملة أو السهم (مثلاً: BTC, ETH, AAPL)",
						},
						category: {
							type: "STRING",
							description:
								"نوع الأصول: 'crypto' للعملات الرقمية أو 'stock' للأسهم.",
						},
					},
					required: ["symbol", "category"],
				},
			},
		],
	},
];

// إنشاء كائن النموذج
let model = genAI.getGenerativeModel({
	model: currentModelName,
	tools: toolsDefinition,
	generationConfig: { maxOutputTokens: 500 },
});

// بدء جلسة المحادثة مع تاريخ فارغ
let chat = model.startChat({ history: [] });

// ==========================================
// 3. الدوال التنفيذية (API Calls)
// ==========================================

// دالة جلب سعر العملات الرقمية من CryptoCompare
async function fetchCryptoPrice(symbol) {
	try {
		const url = `https://min-api.cryptocompare.com/data/price?fsym=${symbol.toUpperCase()}&tsyms=USD`;
		const response = await fetch(url);
		if (!response.ok) throw new Error("Network error");
		const data = await response.json();
		return data.USD ? data.USD : "غير متوفر";
	} catch (error) {
		console.error("خطأ في API العملات:", error);
		return "حدث خطأ أثناء جلب السعر";
	}
}

// الدالة التي يناديها Gemini
const functions = {
	getPrice: async ({ symbol, category }) => {
		console.log(`🔍 جاري معالجة طلب: ${symbol} (${category})`);

		if (category.toLowerCase() === "crypto") {
			const price = await fetchCryptoPrice(symbol);
			return { symbol, price, currency: "USD", provider: "CryptoCompare" };
		} else {
			// محاكاة لسعر الأسهم (يمكنك ربطها بـ Yahoo Finance أو API آخر لاحقاً)
			return {
				symbol,
				price: "150.00 (تجريبي)",
				currency: "USD",
				provider: "StockService",
			};
		}
	},
};

// ==========================================
// 4. منطق المحادثة والواجهة (UI)
// ==========================================

window.sendMessage = async () => {
	const inputField = document.getElementById("user-input");
	const userText = inputField.value.trim();
	if (!userText) return;

	// عرض رسالة المستخدم
	addMessage(userText, "user-msg");
	inputField.value = "";
	const loadingDiv = addMessage("جاري التفكير...", "loading");

	try {
		// 1. إرسال الرسالة إلى Gemini
		let result = await chat.sendMessage(userText);
		let response = await result.response;

		// 2. التحقق مما إذا كان Gemini يطلب استدعاء دالة
		const functionCalls = response.functionCalls();

		if (functionCalls && functionCalls.length > 0) {
			const call = functionCalls[0];
			const functionName = call.name;
			const args = call.args;

			// تحديث رسالة التحميل للمستخدم
			loadingDiv.innerText = `🔄 جاري جلب بيانات ${args.symbol}...`;

			// تنفيذ الدالة المطلوبة
			const functionResponse = await functions[functionName](args);

			// 3. إرسال نتيجة الدالة إلى Gemini مرة أخرى ليصيغ الرد النهائي
			const result2 = await chat.sendMessage([
				{
					functionResponse: {
						name: functionName,
						response: functionResponse,
					},
				},
			]);

			const finalResponse = await result2.response;
			loadingDiv.remove();
			addMessage(finalResponse.text(), "bot-msg");
		} else {
			// رد نصي عادي
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

// دالة مساعدة لإضافة الرسائل للشاشة
function addMessage(text, className) {
	const chatHistory = document.getElementById("chat-history");
	const div = document.createElement("div");
	div.className = `message ${className}`;

	// دعم الماركداون البسيط (Bolding)
	div.innerHTML = text
		.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
		.replace(/\n/g, "<br>");

	chatHistory.appendChild(div);
	chatHistory.scrollTop = chatHistory.scrollHeight;
	return div;
}

const reponsApel = `سعر سهم شركة أبل (AAPL) اليوم هو 262.59 دولار أمريكي.

### نظرة على وضع السهم (التحليل):

1. الأداء السعري: السهم يتداول حالياً في مستويات مرتفعة، مما يعكس ثقة المستثمرين في استقرار الشركة ونموها المستمر، خاصة مع التطورات الأخيرة في قطاع الذكاء الاصطناعي (Apple Intelligence).

2. المحركات الأساسية:
* الذكاء الاصطناعي: دمج ميزات الذكاء الاصطناعي في أجهزة آيفون وأنظمة التشغيل الجديدة يعتبر المحرك الأكبر للتوقعات المستقبلية، حيث يراهن المستثمرون على أن ذلك سيؤدي إلى دورة ترقية كبيرة للهواتف (Supercycle).
* مبيعات الآيفون: تظل مبيعات جهاز الآيفون، خاصة في الأسواق الكبرى مثل الصين والولايات المتحدة، هي المقياس الأساسي لصحة السهم المالية.
* قطاع الخدمات: النمو المستمر في قطاع الخدمات (App Store, iCloud, Apple TV+) يوفر للشركة تدفقات نقدية مستقرة وهوامش ربح عالية.

3. التحليل الفني السريع:
* الاتجاه: السهم يسير في اتجاه صاعد (Upward Trend) بشكل عام على المدى المتوسط.
* مستويات الدعم: إذا حدث تراجع، فإن مستوى 250 - 255 دولار يمثل منطقة دعم فنية قوية.
* المقاومة: السهم يسعى لتجاوز قمم تاريخية جديدة، وأي استقرار فوق مستويات الـ 265 دولار قد يدفعه لمزيد من الصعود.

الخلاصة:
سهم أبل يُعتبر حالياً من الأسهم القيادية التي توفر توازناً بين النمو والأمان (Safe Haven) في محافظ المستثمرين، بانتظار التقارير الفصلية القادمة لتحديد مساره القادم بدقة أكبر.

*ملاحظة: أسواق الأسهم متقلبة، وهذه المعلومات لأغراض تعليمية وليست توصية مباشرة بالشراء أو البيع.*`;

const rpnsBTC = `سعر البيتكوين (BTC) الحالي هو 67,656.7 دولار أمريكي.

### تحليل اتجاه البيتكوين:

بناءً على السعر الحالي والمعطيات السوقية العامة، إليك تحليلاً تقنياً ومبسطاً للاتجاه:

1. الاتجاه العام (Trend):
السعر حالياً في منطقة إيجابية قوية. التداول فوق مستوى 65,000 دولار يشير إلى سيطرة الثيران (المشترين) ومحاولة لتأسيس قاعدة سعرية جديدة للانطلاق نحو القمم التاريخية.

2. مستويات الدعم والمقاومة:
* المقاومة (Resistance): الحاجز القادم هو مستوى 70,000 دولار. تجاوز هذا المستوى والثبات فوقه قد يفتح الباب لموجة صعود قوية (Parabolic Move).
* الدعم (Support): أقرب مستوى دعم قوي هو 65,000 دولار. في حال الهبوط دونه، قد نرى تصحيحاً نحو منطقة 62,000 - 60,000 دولار.

3. التحليل الفني المبسط:
* الزخم: الزخم الحالي صاعد، حيث تظهر العملة قوة في الحفاظ على مستويات مرتفعة رغم تقلبات السوق.
* التجميع: يبدو أن هناك عمليات تجميع (Accumulation) من قبل المؤسسات والمستثمرين الكبار عند هذه المستويات، مما يعزز الثقة في استمرار الاتجاه الصاعد.

4. العوامل المؤثرة حالياً:
* صناديق المؤشرات (ETFs): استمرار التدفقات المالية إلى صناديق البيتكوين يعطي دافعاً مستمراً للسعر.
* السياسة النقدية: أي توقعات بخفض أسعار الفائدة من قبل الفيدرالي الأمريكي تدعم الأصول ذات المخاطر العالية مثل البيتكوين.

الخلاصة:
الاتجاه الحالي صاعد (Bullish) طالما ظل السعر فوق مستويات الـ 64,000 دولار. ومع ذلك، يُنصح دائماً بمراقبة تقلبات السوق والحذر من التصحيحات السعرية المفاجئة التي تتبع عادةً الارتفاعات الكبيرة.

*ملاحظة: هذا التحليل للأغراض المعلوماتية فقط ولا يعتبر نصيحة استثمارية.*`;

const rpnsCmpr = `بناءً على الأسعار المباشرة الآن، إليك مقارنة بين سعر إيثيريوم (ETH) وسولانا (SOL):

* سعر إيثيريوم (ETH): 1,966.39 دولار أمريكي.
* سعر سولانا (SOL): 123.63 دولار أمريكي.

ملاحظات سريعة:
* سعر وحدة ETH الواحدة يعادل حالياً حوالي 15.9 ضعف سعر وحدة SOL.
* تعتبر إيثيريوم العملة الرقمية الثانية من حيث القيمة السوقية الإجمالية، بينما تعتبر سولانا واحدة من أقوى المنافسين لها في مجال العقود الذكية وتطبيقات DeFi.

يرجى ملاحظة أن أسعار العملات الرقمية تتقلب بسرعة كبيرة على مدار الساعة. هل تود معرفة تفاصيل أخرى مثل القيمة السوقية أو حجم التداول؟`;