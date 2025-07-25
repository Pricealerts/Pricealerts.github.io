// functions/utils/telegram.js
const axios = require('axios');
const { TELEGRAM_BOT_TOKEN } = require('../config'); // استيراد التوكن من config.js

/**
 * دالة لإرسال رسالة Telegram.
 * @param {string} chatId - معرف دردشة تيليجرام المستهدف.
 * @param {string} messageText - نص الرسالة المراد إرسالها.
 * @returns {Promise<Object>} كائن يحتوي على success: true/false و response/error.
 */
async function sendTelegramMessage(chatId, messageText) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_PLACEHOLDER') {
        console.error("خطأ: TELEGRAM_BOT_TOKEN غير مهيأ. لا يمكن إرسال رسائل تيليجرام.");
        return { success: false, error: "توكن بوت تيليجرام غير موجود أو غير صالح." };
    }
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const payload = {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML' // للسماح بالتنسيق مثل <b> و <code>
    };

    try {
        const response = await axios.post(TELEGRAM_API_URL, payload);
        console.log(`تم إرسال رسالة تيليجرام بنجاح إلى ${chatId}.`);
        return { success: true, response: response.data };
    } catch (error) {
        console.error("خطأ في إرسال رسالة تيليجرام:", error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

module.exports = { sendTelegramMessage };