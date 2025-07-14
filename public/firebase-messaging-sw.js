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

  // Jika tab aktif, kirim message ke tab, bukan showNotification
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          // Kirim message ke tab aktif
          clientList[0].postMessage(data);
        } else {
          // Tidak ada tab aktif, tampilkan notification biasa
          self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/icons/logo.png",
            actions: [
              {
                action: "dismiss",
                title: "Tutup",
                icon: "/icons/close.png",
              },
            ],
            data: data,
          });
        }
      })
  );
});
