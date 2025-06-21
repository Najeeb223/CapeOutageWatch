const coctAlerts = async () => {

    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-planned.json');
    const data = await res.json();

    setTimeout(() => {

        let output = "";
        data.forEach((alerts, index) => {
            if(alerts.service_area === "Water & Sanitation"){
                output += `${alerts.title}, ${alerts.area}
                `;

        }
        });
        document.getElementById("title-text").innerHTML = output;
    }, 1000);
    
}
coctAlerts().catch(console.error);

