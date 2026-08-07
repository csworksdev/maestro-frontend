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

const resolveNotificationContent = (payload = {}) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title =
    notification.title ||
    data.title ||
    data.notification_title ||
    data.subject ||
    "";
  const body =
    notification.body ||
    data.body ||
    data.message ||
    data.notification_body ||
    "";

  return {
    title: String(title || "").trim(),
    body: String(body || "").trim(),
    data,
  };
};

messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const { title, body, data } = resolveNotificationContent(payload);

  if (!title && !body) {
    console.warn("[firebase-messaging-sw.js] Ignored empty notification", payload);
    return;
  }

  const notificationOptions = {
    body,
    icon: "https://maestroswim.com/wp-content/uploads/2024/01/cropped-5D20BBFE-27FE-4582-A1D6-B64ABC55F5AE.png",
    data,
  };

  self.registration.showNotification(title || "Maestro Swim", notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  let targetUrl = "/";
  try {
    const candidate = new URL(
      event.notification.data?.target_url || "/",
      self.location.origin
    );
    if (candidate.origin === self.location.origin) {
      targetUrl = `${candidate.pathname}${candidate.search}${candidate.hash}`;
    }
  } catch (error) {
    console.warn("[firebase-messaging-sw.js] Ignored malformed target URL", error);
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.postMessage({ type: "notification.click", target_url: targetUrl });
          return;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
