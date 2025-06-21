const coctAlerts = async () => {

    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-planned.json');
    const data = await res.json();

    setTimeout(() => {

        let titleOutput = "";
        data.forEach((alerts, index) => {
            if(alerts.service_area === "Water & Sanitation"){
                titleOutput += `<li>${alerts.title}</li>`;
        }
        });
        document.getElementById("title-text").innerHTML = titleOutput;
    }, 1000);

    setTimeout(() => {

        let areaOutput = "";
        data.forEach((alerts, index) => {
            if(alerts.service_area === "Water & Sanitation"){
                areaOutput += `<li>${alerts.area}</li>`;
        }
        });
        document.getElementById("area-text").innerHTML = areaOutput;
    }, 1000);

    setTimeout(() => {

        let locationOutput = "";
        data.forEach((alerts, index) => {
            if(alerts.service_area === "Water & Sanitation"){
                locationOutput += `<li>${alerts.location}</li>`;
        }
        });
        document.getElementById("location-text").innerHTML = locationOutput;
    }, 1000);

    setTimeout(() => {

        let startTimestampOutput = "";
        data.forEach((alerts, index) => {
            if(alerts.service_area === "Water & Sanitation"){
                startTimestampOutput += `<li>${alerts.start_timestamp}</li>`;
        }
        });
        document.getElementById("start-timestamp-text").innerHTML = startTimestampOutput;
    }, 1000);

    setTimeout(() => {

        let forecastEndTimestampOutput = "";
        data.forEach((alerts, index) => {
            if(alerts.service_area === "Water & Sanitation"){
                forecastEndTimestampOutput += `<li>${alerts.forecast_end_timestamp}</li>`;
        }
        });
        document.getElementById("forecast-end-timestamp-text").innerHTML = forecastEndTimestampOutput;
    }, 1000);

    

    


    
}
coctAlerts().catch(console.error);

