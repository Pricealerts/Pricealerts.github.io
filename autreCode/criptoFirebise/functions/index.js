// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {sendTelegramMessage} = require('./utils/telegram');
const {fetchCandlestickData} = require('./utils/exchangeApi');
const { getAlerts, addAlert, deleteAlert } = require('./data/alerts');

// تهيئة Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore(); // احصل على مرجع لقاعدة بيانات Firestore

// =====================================================================
// === وظيفة HTTP لإدارة التنبيهات (تعيين/حذف/جلب من الواجهة الأمامية) ===
// =====================================================================
// هذه الوظيفة تستقبل طلبات من واجهة HTML الأمامية لتعيين أو حذف التنبيهات
// CORS مفعل للسماح بالوصول من أي نطاق (يمكنك تقييدها في الإنتاج)
exports.manageAlerts = functions.https.onRequest(async (req, res) => {
    // إعدادات CORS للسماح للواجهة الأمامية بالوصول
    res.set('Access-Control-Allow-Origin', '*'); // للسماح بجميع الأصول (للتطوير)
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // التعامل مع طلبات OPTIONS (preflight requests) لـ CORS
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Only POST requests are accepted');
    }

    try {
        const { action, id, exchangeId, symbol, targetPrice, alertCondition, telegramChatId } = req.body;
        let responseData = { status: 'error', message: 'Unknown action.' };

        if (action === 'setAlert') {
            if (!exchangeId || !symbol || isNaN(parseFloat(targetPrice)) || !alertCondition || !telegramChatId) {
                responseData.message = "الرجاء توفير جميع البيانات المطلوبة لتعيين تنبيه.";
                return res.status(400).json(responseData);
            }
            // توليد معرف فريد للتنبيه إذا لم يكن موجودًا (للتحديث أو الإضافة الجديدة)
            const alertId = id || db.collection('alerts').doc().id; 
            await addAlert({
                id: alertId,
                exchange: exchangeId,
                symbol: symbol,
                targetPrice: parseFloat(targetPrice),
                condition: alertCondition,
                telegramChatId: telegramChatId,
                status: "Active",
                requestTime: new Date().toISOString(), // سجل وقت الطلب
                lastChecked: null // Firestore سيقوم بتعيين هذا عند أول فحص
            });
            responseData = { status: 'success', message: 'تم تعيين تنبيه جديد بنجاح.', alertId: alertId };
        } else if (action === 'deleteAlert') {
            if (!id) {
                responseData.message = "الرجاء توفير معرف التنبيه للحذف.";
                return res.status(400).json(responseData);
            }
            const deleted = await deleteAlert(id);
            if (deleted) {
                responseData = { status: 'success', message: 'تم حذف التنبيه بنجاح.' };
            } else {
                responseData = { status: 'error', message: 'لم يتم العثور على التنبيه للحذف.' };
            }
        } else if (action === 'getAlerts') {
            if (!telegramChatId) {
                responseData.message = "الرجاء توفير معرف الدردشة.";
                return res.status(400).json(responseData);
            }
            const alerts = await getAlerts(telegramChatId);
            responseData = { status: 'success', alerts: alerts };
        }

        return res.status(200).json(responseData);
    } catch (error) {
        console.error('Error in manageAlerts function:', error);
        return res.status(500).json({ status: 'error', message: 'An internal server error occurred: ' + error.message });
    }
});

// =====================================================================
// === وظيفة مجدولة (Cron Job) لفحص التنبيهات وإرسالها ===
// =====================================================================
// هذه الوظيفة ستعمل بانتظام (مثلاً كل 5 دقائق) للتحقق من التنبيهات النشطة.
// تحتاج إلى إعداد Cloud Scheduler في Google Cloud Console بعد النشر.
// يتم تشغيلها بواسطة Pub/Sub.
exports.checkPriceAlerts = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    console.log('Running checkPriceAlerts...');

    const alertsCollectionRef = db.collection('alerts');
    // جلب جميع التنبيهات "النشطة"
    const activeAlertsSnapshot = await alertsCollectionRef.where('status', '==', 'Active').get();

    if (activeAlertsSnapshot.empty) {
        console.log('No active alerts to check.');
        return null;
    }

    const currentTriggerTime = new Date();
    const batch = db.batch(); // استخدام Batch Writes لتحسين الأداء عند تحديث/حذف وثائق متعددة

    for (const doc of activeAlertsSnapshot.docs) {
        const alert = doc.data();
        const alertDocRef = doc.ref; // مرجع الوثيقة لتحديثها أو حذفها في الدفعة

        const { id, exchange, symbol, targetPrice, condition, telegramChatId, requestTime } = alert;
        
        // حساب فرق الوقت لتحديد الفاصل الزمني للشموع
        const reqTime = new Date(requestTime);
        const timeDifferenceMinutes = Math.floor((currentTriggerTime.getTime() - reqTime.getTime()) / (1000 * 60));

        let interval;
        let limit;

        if (timeDifferenceMinutes <= 5) {
            interval = '1m';
            limit = Math.max(1, timeDifferenceMinutes); // جلب شموع دقيقة واحدة بعدد الدقائق منذ الطلب
        } else if (timeDifferenceMinutes <= 60) {
            interval = '5m';
            limit = 1; // جلب شمعة 5 دقائق واحدة
        } else {
            interval = '1h';
            limit = 1; // جلب شمعة ساعة واحدة
        }

        console.log(`Checking alert ${id}: ${symbol} on ${exchange}. Diff: ${timeDifferenceMinutes} mins. Fetching ${limit} ${interval} candles.`);

        // تحديث وقت الفحص الأخير للتنبيه
        batch.update(alertDocRef, { lastChecked: admin.firestore.FieldValue.serverTimestamp() });

        const candles = await fetchCandlestickData(exchange, symbol, interval, limit);
        let triggered = false;
        let actualTriggerPrice = null;

        if (candles && candles.length > 0) {
            for (const candle of candles) {
                // التحقق من الشرط بناءً على سعر الإغلاق، الأدنى، أو الأعلى
                if (condition === 'less_than_or_equal') {
                    if (candle.low <= targetPrice) { // استخدام سعر low في الشمعة
                        triggered = true;
                        actualTriggerPrice = candle.low;
                        break;
                    }
                } else if (condition === 'greater_than_or_equal') {
                    if (candle.high >= targetPrice) { // استخدام سعر high في الشمعة
                        triggered = true;
                        actualTriggerPrice = candle.high;
                        break;
                        }
                }
            }
        } else {
            console.warn(`Could not get candle data for ${symbol} on ${exchange}. Skipping alert ${id}.`);
        }

        if (triggered) {
            console.log(`Alert triggered for ${symbol} on ${exchange} at ${actualTriggerPrice}. Sending Telegram notification...`);
            // تأكد من جلب EXCHANGES_CONFIG في هذا الملف أو تمريره
            const { EXCHANGES_CONFIG } = require('./config'); 
            const exchangeName = EXCHANGES_CONFIG[exchange] ? EXCHANGES_CONFIG[exchange].name : exchange;

            const message = `🔔 تنبيه سعر ${exchangeName}!\nعملة <b>${symbol}</b> بلغت <b>${actualTriggerPrice} USDT</b>. (الشرط: السعر ${condition === 'less_than_or_equal' ? 'أقل من أو يساوي' : 'أعلى من أو يساوي'} ${targetPrice} USDT)`;
            
            const sendResult = await sendTelegramMessage(telegramChatId, message);

            if (sendResult.success) {
                console.log(`Telegram notification sent for ${symbol}. Deleting alert.`);
                batch.delete(alertDocRef); // ضع التنبيه للحذف
            } else {
                console.error(`Failed to send Telegram notification for ${symbol} (Alert ID: ${id}):`, sendResult.error);
                // إذا فشل الإرسال، يمكنك تحديث الحالة إلى "فشل" بدلاً من الحذف الفوري
                batch.update(alertDocRef, { status: 'FailedToSend', lastChecked: admin.firestore.FieldValue.serverTimestamp() });
            }
        }
    }
    
    // تنفيذ جميع عمليات Firestore في الدفعة
    await batch.commit(); 
    console.log('checkPriceAlerts finished.');
    return null;
});