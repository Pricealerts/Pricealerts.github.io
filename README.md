# Pricealerts.github.io
Crypto price alearts



rd /s /q node_modules

npm install

firebase deploy --only functions



api: https://us-central1-my-project-1569164439438.cloudfunctions.net/api

my-project-1569164439438
databaseURL: "https://my-project-1569164439438.firebaseio.com"



TELEGRAM_BOT_TOKEN="8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE" firebase emulators:start
firebase functions:config:set telegram.bot_token="8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE"

// الطريقة الآمنة لقراءة التوكن
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 
                          functions.config().telegram?.bot_token || 
                          "8146635194:AAFGD_bkO7OSXHWdEf5ofe35Jm4DjslIhOE"; // Fallback للتنمية فقط

                          admin.initializeApp({
  databaseURL: "https://alertprice-c0176.firebaseio.com"
});
