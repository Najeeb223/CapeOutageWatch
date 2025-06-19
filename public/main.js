const coctAlerts = async () => {

    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
    const data = await res.json();
    console.log(data);
}
coctAlerts().catch(console.error);