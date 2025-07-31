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
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
  
    const targetUrl = event.notification.data?.url || '/';
  
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        // If a tab is already open, focus it
        for (let client of windowClients) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  });
  