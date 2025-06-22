const coctAlerts = async () => {

    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-planned.json');
    const data = await res.json();


        let output = ""; 
        data.forEach((alerts, index) => {
            if(alerts.service_area === "Water & Sanitation"){
                output += `<h3>Title</h3>
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
        }
        });
        for(let output = 0; output < data; output++){
            document.querySelector(".planned-alerts-layout").innerHTML = output;
        }
        
 
    
}
coctAlerts().catch(console.error);

