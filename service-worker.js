

self.addEventListener("push", e => {
    console.log("🔔 Push received", e); 
    const data = e.data ? e.data.text() : "No payload";
    console.log("🔎 Push data:", data);
    
    const notificationPromise = self.registration.showNotification("Cape Town Alert", { 
        body: data,
        requireInteraction: true, 
        silent: false
    }).then(() => {
        console.log("✅ Notification displayed successfully");
    }).catch(err => {
        console.error("❌ Notification failed:", err);
    });
    
    e.waitUntil(notificationPromise);
});



/* Public Key:
BKFjG_8SqCnVM0QHL_xSni4szqp-ELnkhK6JxsE7VWbhTM8d5CF0Yu4zjb-qFMcRWEf0PGo7SSiiD0R7w_XLakU

Private Key:
mV6oxKlW1Gq3Ss1eMoxDN0pp1rKiGi_8Ym5MYH-tY-0 */



/*  Caching of service worker
self.addEventListener("install", e => {
    e.waitUntil(caches.open("static").then(cache => {

        return cache.addAll(directory and files in directory as well as images)
        })
    })
*/
/*
self.addEventListener("fetch", e => {
    console.log(`Intercepting fetch request for: ${e.request.url}`);
} )
*/



