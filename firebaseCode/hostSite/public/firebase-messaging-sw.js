





// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
 apiKey: "AIzaSyDIR4H7Jk3bJN_QZp-Cs4CbqpRmsKkUTxc",
	authDomain: "pricealert-31787.firebaseapp.com",
	projectId: "pricealert-31787",
	storageBucket: "pricealert-31787.firebasestorage.app",
	messagingSenderId: "200237716010",
	appId: "1:200237716010:web:65a9e33254d2302339a953",
});

const messaging = firebase.messaging();

function requestPermission() {
  console.log('Requesting permission...');
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // الآن يمكنك استدعاء getToken
    } else {
      console.log('Unable to get permission to notify.');
    }
  });
}