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

async function fetchAlerts() {
    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
    return await res.json();
}

async function renderAllAlerts() {
    const container = document.querySelector(".planned-alerts-layout");
    container.innerHTML = '';

    const alerts = await fetchAlerts();

    alerts.forEach(alert => {
        if (alert.service_area === "Water & Sanitation" || alert.service_area === "Electricity") {
            const formattedStart = formatCapeToDate(alert.start_timestamp);
            const formattedEnd = formatCapeToDate(alert.forecast_end_timestamp);

            const card = document.createElement("div");
            card.innerHTML = `
                <h3>Title</h3><p>${alert.title}</p>
                <h3>Description</h3><p>${alert.description}</p>
                <h3>Area</h3><p>${alert.area}</p>
                <h3>Location</h3><p>${alert.location}</p>
                <h3>Start Time</h3><p>${formattedStart}</p>
                <h3>Forecasted End</h3><p>${formattedEnd}</p>
            `;
            container.appendChild(card);
        }
    });
}

async function handleRouting() {
    // Always show all alerts — no single alert mode anymore
    renderAllAlerts();
}

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
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    return registration;
};

const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        throw new Error("Notification permission not granted");
    }
};

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
    
    // Check if already subscribed
    const registration = await registerSW();
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (existingSubscription) {
        console.log("🔔 Already subscribed");
     //   document.getElementById('notification-setup').style.display = 'none';
    } else {
        // Show the enable button
        document.getElementById('enable-notifications').onclick = async () => {
            try {
                await requestNotificationPermission();
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array("BKFjG_8SqCnVM0QHL_xSni4szqp-ELnkhK6JxsE7VWbhTM8d5CF0Yu4zjb-qFMcRWEf0PGo7SSiiD0R7w_XLakU")
                });
                
                await saveSubscription(subscription);
                console.log("✅ Notifications enabled!");
                document.getElementById('notification-setup').style.display = 'none';
            } catch (error) {
                alert("Failed to enable notifications. Please try again.");
                console.error(error);
            }
        };
    }
    
    handleRouting();
};

main().catch(console.error);

window.onpopstate = () => {
    handleRouting();
};
