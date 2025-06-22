const coctAlerts = async () => {

    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-planned.json');
    const data = await res.json();


        let output = `<h3>Title</h3>
                      <h3>Area</h3>
                      <h3>Location</h3>
                      <h3>Start</h3>
                      <h3>Forecasted End</h3>
                    `;
        data.forEach((alerts, index) => {
            if(alerts.service_area === "Water & Sanitation"){
                output += `<p>${alerts.title}</p>
                           <p>${alerts.area}</p> 
                           <p>${alerts.location}</p> 
                           <p>${alerts.start_timestamp}</p> 
                           <p>${alerts.forecast_end_timestamp}</p>    
                `;
        }
        });
        document.querySelector(".planned-alert-card").innerHTML = output;
 
    
}
coctAlerts().catch(console.error);

