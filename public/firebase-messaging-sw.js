// public/firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAxA0Mm6WnMnUGaZuMUprFDzMJv_V63Gck",
  authDomain: "maestro-front.firebaseapp.com",
  projectId: "maestro-front",
  storageBucket: "maestro-front.appspot.com",
  messagingSenderId: "988318550591",
  appId: "1:988318550591:web:c266ba0a71387fe5de468a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const { title, body } = payload.notification;

  const notificationOptions = {
    body: body,
    icon: "https://maestroswim.com/wp-content/uploads/2024/01/cropped-5D20BBFE-27FE-4582-A1D6-B64ABC55F5AE.png",
    data: payload.data,
  };

  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener("push", function (event) {
  const data = event.data.json();
  const notificationTitle = data.notification?.title || data.title;
  const notificationOptions = {
    body: data.notification?.body || data.body,
    icon: "https://maestroswim.com/wp-content/uploads/2024/01/cropped-5D20BBFE-27FE-4582-A1D6-B64ABC55F5AE.png",
    data: data,
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});
