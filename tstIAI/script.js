// ==================== إعدادات API والمتغيرات العامة ====================
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// مخزن المحادثة
let chatHistory = [];
let isProcessing = false;

// ==================== دوال جلب الأسعار المخصصة ====================

/**
 * دالة جلب أسعار العملات الرقمية
 * @param {string} symbol - رمز العملة (مثل: BTC, ETH)
 * @returns {Promise<Object>} - معلومات السعر
 */
async function cryptoPrc(symbol) {
    try {
        // هذا مثال - قم بتعديله لاستخدام مصدر البيانات الخاص بك
        const mockPrices = {
            'BTC': 65432.50,
            'ETH': 3521.80,
            'BNB': 412.30,
            'XRP': 0.58,
            'ADA': 0.45,
            'DOT': 7.89,
            'LINK': 18.23,
            'LTC': 82.15,
            'BCH': 265.40,
            'XLM': 0.12,
            'SOL': 145.30,
            'DOGE': 0.08
        };
        
        const upperSymbol = symbol.toUpperCase();
        
        if (mockPrices[upperSymbol]) {
            return {
                success: true,
                symbol: upperSymbol,
                price: mockPrices[upperSymbol],
                currency: 'USD',
                change: (Math.random() * 5 - 2.5).toFixed(2) + '%',
                type: 'crypto'
            };
        } else {
            return {
                success: false,
                error: `لم يتم العثور على العملة الرقمية ${symbol}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * دالة جلب أسعار الأسهم
 * @param {string} symbol - رمز السهم (مثل: AAPL, MSFT)
 * @returns {Promise<Object>} - معلومات السعر
 */
async function stockPrc(symbol) {
    try {
        // هذا مثال - قم بتعديله لاستخدام مصدر البيانات الخاص بك
        const mockPrices = {
            'AAPL': 175.50,
            'GOOGL': 142.30,
            'MSFT': 378.85,
            'AMZN': 145.75,
            'TSLA': 245.60,
            'META': 312.45,
            'NFLX': 485.20,
            'NVDA': 824.15,
            'PYPL': 67.30,
            'ADBE': 525.40,
            'ORCL': 127.50,
            'IBM': 168.30
        };
        
        const upperSymbol = symbol.toUpperCase();
        
        if (mockPrices[upperSymbol]) {
            return {
                success: true,
                symbol: upperSymbol,
                price: mockPrices[upperSymbol],
                currency: 'USD',
                change: (Math.random() * 3 - 1.5).toFixed(2) + '%',
                type: 'stock'
            };
        } else {
            return {
                success: false,
                error: `لم يتم العثور على السهم ${symbol}`
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// ==================== دالة ذكية لتحديد نوع الرمز ====================

/**
 * دالة ذكية تستخدم DeepSeek لتحديد نوع الرمز (عملة أم سهم)
 * @param {string} symbol - الرمز المراد تحديد نوعه
 * @param {string} apiKey - مفتاح API
 * @param {string} context - سياق المحادثة للمساعدة في التحديد
 * @returns {Promise<string>} - نوع الرمز (crypto, stock, unknown)
 */
async function determineSymbolType(symbol, apiKey, context = '') {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `أنت خبير في الأسواق المالية. مهمتك هي تحديد ما إذا كان الرمز المالي المطلوب هو عملة رقمية (cryptocurrency) أم سهم (stock).

قواعد التحديد:
- العملات الرقمية: BTC, ETH, BNB, XRP, ADA, DOT, LINK, LTC, BCH, XLM, SOL, DOGE, SHIB, MATIC, AVAX, UNI, ATOM, ALGO, VET, ICP, FIL, ETC, THETA, FTN, EOS, KSM, YFI, COMP, MKR, SUSHI, AAVE, SNX, CRV, ENJ, MANA, SAND, AXS, GALA, CHZ, AMP, BAT, ZRX, KNC, OMG, LRC, CVC, GNT, REP, ANT, BAL, BNT, NMR, REN, STORJ, TRB, BAND, JASMY, FARM, PERP, DYDX, ENS, GMT, APE, IMX, APT, ARB, OP, BLUR, SEI, TIA, PYTH, JTO, WIF, BONK, PEPE, FLOKI, WLD, TON, NOT, DOGS, HMSTR, CATI, NEIRO
- الأسهم: AAPL, GOOGL, MSFT, AMZN, TSLA, META, NFLX, NVDA, PYPL, ADBE, ORCL, IBM, KO, PEP, JPM, BAC, WMT, TGT, HD, LOW, MCD, SBUX, DIS, CMCSA, VZ, T, CSCO, INTC, AMD, QCOM, TXN, AVGO, ASML, CRM, NOW, SHOP, SQ, COIN, HOOD, PLTR, SNOW, DDOG, NET, ZS, PANW, CRWD, OKTA, DOCU, WORK, ZM, ROKU, PINS, SNAP, UBER, LYFT, DASH, ABNB, RBLX, CELH, MNST, TTD, MDB, MSTR, DELL, HPQ, HPE, WDC, MU, STX, NTAP, ANET, FFIV, JNPR, UI, AKAM, VRSN, CDW, EPAM, AKAM, FFIV, NTNX, PURE, ESTC, FSLY, FAST, PAYC, PAYX, ADP, CTAS, CERN, CVS, CI, UNH, HUM, ANTM, CNC, MOH, LNC, MET, PRU, AFL, ALL, TRV, PGR, CB, AIG, BRK.B, MKL, WRB, RGA, UNM, GL, L, CNA, FNF, AON, AJG, BRO, MMC, WTW, GNW, RDN, MTG, ACT, ERIE, KMPR, OS CR, PLMR, HCI, HRTG, KINS, LMND, ROOT, UWMC, RKT, ZG, Z, EXPI, COMP, RDFN, OPEN, MMI, HOUS, CWK, CBRE, JLL, CIGI, BEKE, FRT, MAC, SPG, REG, KIM, BRX, NNN, DRE, PLD, WY, EXR, PSA, CUBE, UDR, AVB, EQR, INVH, ESS, MAA, CPT, AMH, SUI, LAMR, OUT, VICI, GLPI, MGP, ILPT, REXR, EG P, TRNO, ARE, COLD, FR, STAG, DLR, EQIX, CONE, COR, QTS, SWCH, RXRX, APLD, WDC, RNG, FIVN, TWLO, VG, W, GTLB, FRSH, ASAN, JAMF, APPN, NEWR, DT, PING, ESTC, MDB, MSTR, DELL, HPQ, HPE, WDC, MU, STX, NTAP, ANET, FFIV, JNPR, UI, AKAM, VRSN, CDW, EPAM, AKAM, FFIV, NTNX, PURE, ESTC, FSLY, FAST, PAYC, PAYX, ADP, CTAS, CERN, CVS, CI, UNH, HUM, ANTM, CNC, MOH, LNC, MET, PRU, AFL, ALL, TRV, PGR, CB, AIG, BRK.B, MKL, WRB, RGA, UNM, GL, L, CNA, FNF, AON, AJG, BRO, MMC, WTW, GNW, RDN, MTG, ACT, ERIE, KMPR, OSC R, PLMR, HCI, HRTG, KINS, LMND, ROOT, UWMC, RKT, ZG, Z, EXPI, COMP, RDFN, OPEN, MMI, HOUS, CWK, CBRE, JLL, CIGI, BEKE, FRT, MAC, SPG, REG, KIM, BRX, NNN, DRE, PLD, WY, EXR, PSA, CUBE, UDR, AVB, EQR, INVH, ESS, MAA, CPT, AMH, SUI, LAMR, OUT, VICI, GLPI, MGP, ILPT, REXR, EGP, TRNO, ARE, COLD, FR, STAG, DLR, EQIX, CONE, COR, QTS, SWCH, RXRX, APLD, WDC, RNG, FIVN, TWLO, VG, W, GTLB, FRSH, ASAN, JAPPN, NEWR, DT, PING

المخرجات المطلوبة:
- إذا كان الرمز عملة رقمية: أعد "crypto"
- إذا كان الرمز سهماً: أعد "stock"
- إذا لم تكن متأكداً أو الرمز غير معروف: أعد "unknown"

أعد فقط الكلمة المحددة بدون أي نص إضافي.`
                    },
                    {
                        role: 'user',
                        content: `الرمز: ${symbol}\nسياق المحادثة: ${context || 'لا يوجد'}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 10
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.choices[0].message.content.trim().toLowerCase();
        
        // التحقق من صحة النتيجة
        if (result === 'crypto' || result === 'stock' || result === 'unknown') {
            return result;
        } else {
            console.warn(`نتيجة غير متوقعة من AI: ${result}`);
            return 'unknown';
        }
        
    } catch (error) {
        console.error('خطأ في تحديد نوع الرمز:', error);
        return 'unknown';
    }
}

/**
 * دالة ذكية لجلب سعر الرمز بناءً على نوعه
 * @param {string} symbol - الرمز المراد جلب سعره
 * @param {string} apiKey - مفتاح API
 * @param {string} context - سياق المحادثة
 * @returns {Promise<Object>} - معلومات السعر
 */
async function getPriceIntelligently(symbol, apiKey, context = '') {
    // أولاً: تحديد نوع الرمز باستخدام الذكاء الاصطناعي
    const symbolType = await determineSymbolType(symbol, apiKey, context);
    
    console.log(`تم تحديد ${symbol} كـ: ${symbolType}`);
    
    // ثانياً: استخدام الدالة المناسبة بناءً على النوع
    switch (symbolType) {
        case 'crypto':
            return await cryptoPrc(symbol);
        case 'stock':
            return await stockPrc(symbol);
        default:
            // إذا لم يتم التعرف، جرب كلا الدالتين
            const cryptoResult = await cryptoPrc(symbol);
            if (cryptoResult.success) {
                return { ...cryptoResult, determinedBy: 'fallback-crypto' };
            }
            
            const stockResult = await stockPrc(symbol);
            if (stockResult.success) {
                return { ...stockResult, determinedBy: 'fallback-stock' };
            }
            
            return {
                success: false,
                error: `لم نتمكن من التعرف على الرمز ${symbol} كعملة رقمية أو سهم`
            };
    }
}

/**
 * تحديث الأسعار المباشرة في الشريط الجانبي
 */
async function updateLivePrices() {
    try {
        const apiKey = document.getElementById('api-key').value.trim();
        if (!apiKey) return;
        
        // تحديث أسعار العملات
        const btcPrice = await getPriceIntelligently('BTC', apiKey, 'تحديث الأسعار المباشرة');
        const ethPrice = await getPriceIntelligently('ETH', apiKey, 'تحديث الأسعار المباشرة');
        const aaplPrice = await getPriceIntelligently('AAPL', apiKey, 'تحديث الأسعار المباشرة');
        
        document.getElementById('btc-price').textContent = 
            btcPrice.success ? `$${btcPrice.price.toLocaleString()}` : 'غير متوفر';
        document.getElementById('eth-price').textContent = 
            ethPrice.success ? `$${ethPrice.price.toLocaleString()}` : 'غير متوفر';
        document.getElementById('aapl-price').textContent = 
            aaplPrice.success ? `$${aaplPrice.price.toLocaleString()}` : 'غير متوفر';
        
        // تحديث وقت آخر تحديث
        document.getElementById('update-time').textContent = 
            new Date().toLocaleTimeString('ar-SA');
    } catch (error) {
        console.error('خطأ في تحديث الأسعار:', error);
    }
}

// تحديث الأسعار كل 30 ثانية
//setInterval(updateLivePrices, 30000);

// ==================== دوال معالجة النصوص ====================

/**
 * استخراج الرموز المالية من النص
 * @param {string} text - النص المراد تحليله
 * @returns {Array} - مصفوفة الرموز المستخرجة
 */
function extractSymbols(text) {
    // نمط للبحث عن الرموز المالية (كلمات كبيرة تتكون من 2-5 أحرف)
    const symbolPattern = /\b[A-Z]{2,5}\b/g;
    const matches = text.toUpperCase().match(symbolPattern) || [];
    
    // إزالة التكرارات
    return [...new Set(matches)];
}

/**
 * جلب معلومات الأسعار للرموز المستخرجة باستخدام الذكاء الاصطناعي
 * @param {Array} symbols - مصفوفة الرموز
 * @param {string} apiKey - مفتاح API
 * @param {string} context - سياق المحادثة
 * @returns {Promise<string>} - معلومات الأسعار المنسقة
 */
async function getPriceInfoIntelligently(symbols, apiKey, context) {
    let priceInfo = [];
    
    for (const symbol of symbols) {
        const result = await getPriceIntelligently(symbol, apiKey, context);
        
        if (result.success) {
            let emoji = result.type === 'crypto' ? '💰' : '📈';
            if (result.determinedBy === 'fallback-crypto') emoji = '🔍💰';
            if (result.determinedBy === 'fallback-stock') emoji = '🔍📈';
            
            priceInfo.push(`${emoji} ${result.symbol}: $${result.price.toLocaleString()} (${result.change})`);
        } else {
            priceInfo.push(`❓ ${symbol}: ${result.error}`);
        }
    }
    
    return priceInfo.length > 0 ? 
        'معلومات الأسعار الحالية:\n' + priceInfo.join('\n') : '';
}

// ==================== دوال التفاعل مع DeepSeek API ====================

/**
 * إرسال رسالة إلى DeepSeek API
 * @param {string} message - رسالة المستخدم
 * @param {string} apiKey - مفتاح API
 * @returns {Promise<string>} - رد المساعد
 */
async function sendToDeepSeek(message, apiKey) {
    try {
        // استخراج الرموز من الرسالة
        const symbols = extractSymbols(message);
        
        // جلب معلومات الأسعار للرموز باستخدام الذكاء الاصطناعي
        let priceContext = '';
        if (symbols.length > 0) {
            priceContext = await getPriceInfoIntelligently(symbols, apiKey, message);
        }
        
        // بناء السياق الكامل
        const fullContext = priceContext ? 
            `${priceContext}\n\nسؤال المستخدم: ${message}` : 
            message;
        
        // إعداد الطلب
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `أنت مساعد تداول متخصص باللغة العربية. لديك القدرة على:
1. التعرف على الرموز المالية (عملات رقمية وأسهم)
2. استخدام معلومات الأسعار المتوفرة للإجابة على أسئلة المستخدمين
3. تقديم تحليلات مالية دقيقة مع التأكيد على أن المعلومات تعليمية فقط
ملاحظة: أنت من يحدد نوع الرمز (عملة أم سهم) باستخدام معرفتك الواسعة بالأسواق المالية.`
                    },
                    {
                        role: 'user',
                        content: fullContext
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('خطأ في الاتصال بـ DeepSeek:', error);
        throw error;
    }
}

// ==================== دوال واجهة المستخدم ====================

/**
 * إضافة رسالة إلى المحادثة
 * @param {string} message - نص الرسالة
 * @param {string} sender - المرسل (user/assistant)
 */
function addMessageToChat(message, sender) {
    const chatContainer = document.getElementById('chat-container');
    const welcomeMessage = document.getElementById('welcome-message');
    
    // إخفاء رسالة الترحيب إذا كانت موجودة
    if (welcomeMessage && welcomeMessage.style.display !== 'none') {
        welcomeMessage.style.display = 'none';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const time = new Date().toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // تنسيق النص مع دعم الروابط والأسعار
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${formattedMessage}
        </div>
        <div class="message-time">${time}</div>
    `;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * إظهار مؤشر الكتابة
 */
function showTypingIndicator() {
    const chatContainer = document.getElementById('chat-container');
    const indicator = document.createElement('div');
    indicator.className = 'message assistant-message typing-indicator-container';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatContainer.appendChild(indicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * إخفاء مؤشر الكتابة
 */
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * إظهار إشعار
 * @param {string} message - نص الإشعار
 * @param {boolean} isError - هل هو خطأ
 */
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    notificationMessage.textContent = message;
    notification.style.background = isError ? '#e74c3c' : '#2c3e50';
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

/**
 * إرسال الرسالة
 */
async function sendMessage() {
    if (isProcessing) return;
    
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    const apiKey = document.getElementById('api-key').value.trim();
    
    if (!message) {
        showNotification('الرجاء كتابة رسالة', true);
        return;
    }
    
    if (!apiKey) {
        showNotification('الرجاء إدخال مفتاح DeepSeek API', true);
        return;
    }
    
    // تعطيل زر الإرسال
    isProcessing = true;
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    
    // إضافة رسالة المستخدم
    addMessageToChat(message, 'user');
    input.value = '';
    
    // إظهار مؤشر الكتابة
    showTypingIndicator();
    
    try {
        // إرسال إلى DeepSeek
        const response = await sendToDeepSeek(message, apiKey);
        
        // إخفاء مؤشر الكتابة
        hideTypingIndicator();
        
        // إضافة رد المساعد
        addMessageToChat(response, 'assistant');
        
    } catch (error) {
        hideTypingIndicator();
        showNotification('حدث خطأ في الاتصال بالخادم: ' + error.message, true);
        console.error(error);
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
    }
}

/**
 * مسح المحادثة
 */
function clearChat() {
    const chatContainer = document.getElementById('chat-container');
    const welcomeMessage = document.getElementById('welcome-message');
    
    chatContainer.innerHTML = '';
    chatContainer.appendChild(welcomeMessage);
    welcomeMessage.style.display = 'block';
    
    showNotification('تم مسح المحادثة');
}

/**
 * إرفاق ملف
 */
function attachFile() {
    showNotification('خاصية إرفاق الملفات قيد التطوير', true);
}

/**
 * إرسال استعلام سريع
 * @param {string} query - الاستعلام
 */
function quickQuery(query) {
    document.getElementById('user-input').value = query;
    sendMessage();
}

/**
 * معالجة الضغط على Enter
 * @param {Event} event - حدث الضغط
 */
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// ==================== تهيئة الصفحة ====================

document.addEventListener('DOMContentLoaded', () => {
    // تحديث الأسعار عند تحميل الصفحة
   // setTimeout(updateLivePrices, 1000);
    
    // إضافة مستمع للأحداث لحقل الإدخال
    const input = document.getElementById('user-input');
    input.addEventListener('keypress', handleKeyPress);
    
    // التحقق من وجود مفتاح API في localStorage
    const savedApiKey = localStorage.getItem('deepseek_api_key');
    if (savedApiKey) {
        document.getElementById('api-key').value = savedApiKey;
        // تحديث الأسعار بعد تحميل المفتاح
       // setTimeout(updateLivePrices, 2000);
    }
    
    // حفظ مفتاح API عند تغييره
    document.getElementById('api-key').addEventListener('change', (e) => {
        localStorage.setItem('deepseek_api_key', e.target.value);
        // تحديث الأسعار بعد تغيير المفتاح
        updateLivePrices();
    });
});

// تصدير الدوال للاستخدام العام
window.sendMessage = sendMessage;
window.clearChat = clearChat;
window.attachFile = attachFile;
window.quickQuery = quickQuery;







































// realApi.js - دوال حقيقية لجلب الأسعار

/**
 * جلب أسعار العملات الرقمية من CoinGecko
 */
async function fetchCryptoPriceFromCoinGecko(symbol) {
    try {
        const coinId = getCoinGeckoId(symbol);
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await response.json();
        
        if (data[coinId]) {
            return {
                success: true,
                symbol: symbol,
                price: data[coinId].usd,
                change: data[coinId].usd_24h_change?.toFixed(2) + '%' || '0%'
            };
        }
        return { success: false, error: 'لم يتم العثور على العملة' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * جلب أسعار الأسهم من Alpha Vantage
 */
async function fetchStockPriceFromAlphaVantage(symbol, apiKey) {
    try {
        const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
        );
        const data = await response.json();
        
        if (data['Global Quote'] && data['Global Quote']['05. price']) {
            return {
                success: true,
                symbol: symbol,
                price: parseFloat(data['Global Quote']['05. price']),
                change: data['Global Quote']['10. change percent'] || '0%'
            };
        }
        return { success: false, error: 'لم يتم العثور على السهم' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}