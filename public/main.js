
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
    const plannedAlertData = await res.json();

   
    plannedAlertData.forEach((alerts, index) => {
            if(alerts.service_area === "Electricity"){
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
   
    if(!('serviceWorker' in navigator)) {
        throw new Error ("No support for service worker!");
    }

    if(!('Notification' in window)) {
        throw new Error("No support for Notification API")
    }
       
}

const registerSW = async () => {

    const registration = await navigator.serviceWorker.register('service-worker.js');
    return registration;
}



const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();

    if(permission !== 'granted') {
        throw new Error("Notification permisson not granted")
    } else {
        new Notification("Hello World");
    }
}

checkPermission();
registerSW();
requestNotificationPermission();

/*
const testNoti = () => {

    const sendNotificationBtn = document.getElementById("notification-btn");

    sendNotificationBtn.addEventListener("click", () => {
            Notification.requestPermission().then(perm => {
                if (perm === "granted") {
                    new Notification("Example notification")
                   
                }
            })
    })
}

testNoti();
*/