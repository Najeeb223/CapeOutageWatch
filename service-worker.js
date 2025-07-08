// Function to encode the applicationServerKey in base64url due to the JSON websignature

const urlBase64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray  = new Uint8Array(rawData.length);

    for(let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
        return outputArray;
}

const saveSubscription = async (subscription) => {

    const response = await fetch('http://localhost:8080/save-subscription', {
        method: 'post',
        headers: { 'Content-type': "application/json"},
        body: JSON.stringify(subscription)
    })

    return response.json();
}

    // The service worker goes through a life cycle
self.addEventListener("activate", async (e) => {
    // NB: Chrome expects application server key
    const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array("BKFjG_8SqCnVM0QHL_xSni4szqp-ELnkhK6JxsE7VWbhTM8d5CF0Yu4zjb-qFMcRWEf0PGo7SSiiD0R7w_XLakU")
    });

    const response = await saveSubscription(subscription);
    console.log(response);
})
    
self.addEventListener("push", e => {
    console.log("🔔 Push received", e);  // <-- Add this
    const data = e.data ? e.data.text() : "No payload";
    console.log("🔎 Push data:", data);
    self.registration.showNotification("Wohoo!", { body: e.data.text() })
})


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



