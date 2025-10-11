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

// Function to toggle the mobile menu visibility
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    // Toggle the class that controls the slide-in/slide-out transition defined in CSS
    if (menu) {
        menu.classList.toggle('visible-menu');
    }
}

// --- Event Listeners Attachment ---

// Add a listener to the burger icon to toggle the menu
const menuToggle = document.getElementById('menu-toggle');
if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
}

// Optional: Add basic listeners to close the menu when a link is clicked
const aboutLink = document.getElementById('about-link');
const contactLink = document.getElementById('contact-link');

if (aboutLink) {
    aboutLink.addEventListener('click', toggleMenu); // Closes menu when clicked
}

if (contactLink) {
    contactLink.addEventListener('click', toggleMenu); // Closes menu when clicked
}

// Note: Ensure this snippet runs after the DOM is fully loaded.


// NEW SNIPPET 2: Function to scroll and highlight the deep-linked card
    function scrollToAndHighlightAlert() {
    // 1. Check the URL for the 'alertId' parameter
    const urlParams = new URLSearchParams(window.location.search);
    const targetAlertId = urlParams.get('alertId');

    if (targetAlertId) {
        // 2. Construct the full HTML ID (e.g., 'alert-37574')
        const targetElementId = `alert-${targetAlertId}`;
        const targetElement = document.getElementById(targetElementId);

        if (targetElement) {
            // 3. Scroll smoothly to the element
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // 4. Temporarily highlight the card (requires CSS, see notes below)
            targetElement.classList.add('highlight-alert');
            
            // Remove the highlight after 4 seconds
            setTimeout(() => {
                targetElement.classList.remove('highlight-alert');
            }, 4000); 

            // 5. Clean the URL (Optional but recommended for a cleaner look)
            // history.replaceState(null, '', window.location.pathname + window.location.hash);
        }
    }
}

// Fetching and rendering logic (kept as is)
async function fetchAlerts() {
    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
    return await res.json();
}

async function renderAllAlerts() {
    const container = document.querySelector(".planned-alerts-layout");
    container.innerHTML = '';

    const alerts = await fetchAlerts();

   // NEW SNIPPET 1: Update the renderAllAlerts function in main.js
    alerts.forEach(alert => {
    // Filter: Water & Sanitation + Electricity alerts only (as per context)
    if (alert.service_area === "Water & Sanitation" || alert.service_area === "Electricity") {
        const formattedStart = formatCapeToDate(alert.start_timestamp);
        const formattedEnd = formatCapeToDate(alert.forecast_end_timestamp);

        const card = document.createElement("div");
        card.className = "alert-card";
        // *** CRITICAL CORRECTION (Revert): Use the API's property 'Id' ***
        card.id = `alert-${alert.Id}`; // Use 'Id' for the frontend rendering
        // ***************************************************************
        // ************************************************************

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

// NEW SNIPPET 3: Update handleRouting to trigger the scroll after rendering
async function handleRouting() {
    await renderAllAlerts();
    
    // FINAL CRITICAL FIX: Add a small delay (e.g., 50ms) to ensure the DOM is fully rendered
    setTimeout(() => {
        scrollToAndHighlightAlert(); 
    }, 50);
}

// Utility to convert VAPID key (kept as is)
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

// Function to save subscription (kept as is)
const saveSubscription = async (subscription) => {
    try {
        const response = await fetch('https://capeoutagewatch.onrender.com/save-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        if (!response.ok) {
            throw new Error('Failed to save subscription on server.');
        }
        return response.json();
    } catch (error) {
        console.error('Subscription save failed:', error);
        // Important: Throwing here allows the caller to know it failed.
        throw error; 
    }
};

/**
 * CORE FIX: Consolidated and robust notification subscription flow.
 * This is called by the user's click action.
 */
const subscribeUser = async (registration) => {
    // 1. Request Permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        // Update the button or UI to show failure/denial
        const button = document.getElementById('enableNotifications');
        if (button) {
            button.textContent = "🚫 Notifications Denied";
            button.disabled = true;
        }
        throw new Error("Notification permission not granted");
    }

    // 2. Check/Update Subscription
    try {
        const applicationServerKey = "BKFjG_8SqCnVM0QHL_xSni4szqp-ELnkhK6JxsE7VWbhTM8d5CF0Yu4zjb-qFMcRWEf0PGo7SSiiD0R7w_XLakU";
        
        // Always try to get a new subscription if the existing one is null (expired/deleted)
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            console.log("No existing subscription found, creating new one...");
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(applicationServerKey)
            });
        } else {
            console.log("Existing subscription found and is valid.");
        }

        // 3. Save/Update Subscription on Backend (Always save in case subscription object changed)
        await saveSubscription(subscription);
        console.log("✅ Notifications enabled and subscription saved!");

        const button = document.getElementById('enableNotifications');
        if (button) {
            button.textContent = "✅ Alerts Enabled";
            button.disabled = true;
        }

    } catch (error) {
        console.error('Push subscription failed:', error);
        alert('Failed to enable push notifications. Check console for details.');
        // Optionally, re-enable button for retry if the error is not 'denied'
        const button = document.getElementById('enableNotifications');
        if (button) {
             button.textContent = "🔔 Enable Outage Alerts (Error)";
             button.disabled = false;
        }
    }
};


const main = async () => {
    handleRouting(); // Render alerts immediately

    const isPushSupported = 'serviceWorker' in navigator && 
                           'Notification' in window && 
                           'PushManager' in window;

    if (!isPushSupported) {
        console.warn("Push notifications not supported on this device/browser.");
        const button = document.getElementById('enableNotifications');
        if (button) button.style.display = 'none'; // Hide button if unsupported
        return; // Exit main if core APIs are missing
    }

    let registration;

    try {
        // Service Worker Registration: The first thing to do.
        registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log("✅ Service Worker registered successfully.");
        
        // Check for existing permission/subscription on load
        const button = document.getElementById('enableNotifications');
        if (Notification.permission === 'granted') {
            button.textContent = "⚙️ Checking Alerts Status...";
            // Automatically re-subscribe/check if permission is granted
            await subscribeUser(registration); 
        } else if (Notification.permission === 'denied') {
            button.textContent = "🚫 Notifications Denied";
            button.disabled = true;
        } else {
            // Permission is 'default' - wait for user click.
            button.textContent = "🔔 Enable Outage Alerts";
            button.disabled = false;
        }

        // Attach the listener to the button for user activation (Fix 1)
        button.addEventListener('click', () => {
            subscribeUser(registration).catch(console.error);
        });

    } catch (error) {
        console.error('Initial setup failed (SW or initial subscription check):', error);
    }
};

main().catch(console.error);

window.onpopstate = () => {
    handleRouting();
};