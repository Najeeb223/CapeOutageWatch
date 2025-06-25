const coctAlerts = async () => {

    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
    const plannedAlertData = await res.json();

    

    plannedAlertData.forEach((alerts, index) => {
        
        let startTime = new Date();
        let endTime = new Date();

       alerts.start_timestamp = startTime.toLocaleString();
       alerts.forecast_end_timestamp = endTime.toLocaleString();

        
    })



    plannedAlertData.forEach((alerts, index) => {
            if(alerts.service_area === "Electricity"){
                let newElement = document.createElement("div");
                newElement.innerHTML = `<h3>Title</h3>
                                        <p>${alerts.title}</p>
                                        <h3>Area</h3>
                                        <p>${alerts.area}</p>
                                        <h3>Location</h3>
                                        <p>${alerts.location}</p> 
                                        <h3>Start Time</h3>                
                                        <p>${alerts.start_timestamp}</p> 
                                        <h3>Forecasted End</h3>
                                        <p>${alerts.forecast_end_timestamp}</p> 
                                        `;
                document.querySelector(".planned-alerts-layout").appendChild(newElement);
   
        }
        });

    
}
coctAlerts().catch(console.error);

