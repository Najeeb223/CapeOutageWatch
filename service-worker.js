self.addEventListener("push", e => {
    console.log("🔔 Push received", e);
    let data = { title: "Cape Town Alert", body: "No payload" };
  
    if (e.data) {
      try {
        data = e.data.json();
      } catch {
        data.body = e.data.text();
      }
    }
  
    const notificationPromise = self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/images/manifest-icon-512.maskable.png",
      requireInteraction: true,
      silent: false
    });
  
    e.waitUntil(notificationPromise);
  });
  