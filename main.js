
function formatCapeToDate(timestamp) {
        if (!timestamp) {
            return "Not specified";
        }
        
        try {
            const date = new Date(timestamp);
            
            if (isNaN(date.getTime())) {
                return "Invalid date";
            }
            
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Africa/Johannesburg'
            };
            
            return date.toLocaleString('en-ZA', options);
            
        } catch (error) {
            console.error('Date formatting error:', error);
            return "Date unavailable";
        }
    }
    

const coctAlerts = async () => {

    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
    const alertData = await res.json();

   
    alertData.forEach((alerts, index) => {
            if(alerts.service_area === "Water & Sanitation" || "Electricity"){
                const formattedStartTime = formatCapeToDate(alerts.start_timestamp);
                const formattedEndTime = formatCapeToDate(alerts.forecast_end_timestamp);
                let newElement = document.createElement("div");
                newElement.innerHTML = `<h3>Title</h3>
                                        <p>${alerts.title}</p>
                                        <h3>Description</h3>
                                        <p>${alerts.description}</p>
                                        <h3>Area</h3>
                                        <p>${alerts.area}</p>
                                        <h3>Location</h3>
                                        <p>${alerts.location}</p> 
                                        <h3>Start Time</h3>                
                                        <p>${formattedStartTime}</p> 
                                        <h3>Forecasted End</h3>
                                        <p>${formattedEndTime}</p> 
                                        `;
                document.querySelector(".planned-alerts-layout").appendChild(newElement);
   
        }
        });

    
}
coctAlerts().catch(console.error);



const checkPermission = () => {
    if (!('serviceWorker' in navigator)) {
        throw new Error("No support for service worker!");
    }

    if (!('Notification' in window)) {
        throw new Error("No support for Notification API");
    }

    if (!('PushManager' in window)) {
        throw new Error("No support for Push API");
    }
};

const registerSW = async () => {
    const registration = await navigator.serviceWorker.register('service-worker.js');
    return registration;
};

const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        throw new Error("Notification permission not granted");
    }
};

// Converts the VAPID public key to a format the browser understands
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

// Sends the subscription object to the backend server to be saved in DB
const saveSubscription = async (subscription) => {
    const response = await fetch('https://capeoutagewatch.onrender.com/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
    });

    return response.json();
};

const main = async () => {
    checkPermission();
    await requestNotificationPermission();
    const registration = await registerSW();

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BKFjG_8SqCnVM0QHL_xSni4szqp-ELnkhK6JxsE7VWbhTM8d5CF0Yu4zjb-qFMcRWEf0PGo7SSiiD0R7w_XLakU")
    });

    const response = await saveSubscription(subscription);
    console.log("Subscription saved:", response);
};

main();


const searchArea = async () => {

    const searchAreaBtn = document.getElementById("search-area-btn");

}

searchArea();