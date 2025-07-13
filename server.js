const express = require('express');
const port = process.env.PORT || 8000;
const webpush = require('web-push');


//utility to help with file paths
const path = require('path');

const app = express();
const cors = require("cors");
app.use(cors());
/* Public Key:
BKFjG_8SqCnVM0QHL_xSni4szqp-ELnkhK6JxsE7VWbhTM8d5CF0Yu4zjb-qFMcRWEf0PGo7SSiiD0R7w_XLakU

Private Key:
mV6oxKlW1Gq3Ss1eMoxDN0pp1rKiGi_8Ym5MYH-tY-0 */
const apiKeys = {
    publicKey: "BKFjG_8SqCnVM0QHL_xSni4szqp-ELnkhK6JxsE7VWbhTM8d5CF0Yu4zjb-qFMcRWEf0PGo7SSiiD0R7w_XLakU",
    privateKey: "mV6oxKlW1Gq3Ss1eMoxDN0pp1rKiGi_8Ym5MYH-tY-0"
}

webpush.setVapidDetails(
    'mailto:najeebwarsame@gmail.com',
    apiKeys.publicKey,
    apiKeys.privateKey

)

// Setup static folder
// Middleware - is a function that runs between the incoming request and outgoing response
app.use(express.static(path.join(__dirname, '.')));

app.use(express.json());
const schedule = require('node-schedule');


app.get("/", (req, res) => {
    res.send("Hello World");
})

const subDatabase = [];


app.post("/save-subscription", (req, res) => {
    console.log("Received subscription:", req.body);
    subDatabase.push(req.body);
    res.json({ status: "Success", message: "Subscription saved!" });
})

app.get("/send-notification", (req, res) => {
    console.log("Subscription object:", subDatabase[0]);
    webpush.sendNotification(subDatabase[0], "Hello World");
    res.json({ "status": "Success", "message": "Message sent to the push service" });
})


const notifyAlerts = () => {
    const job = schedule.scheduleJob('* 10 * * * *', async () => {
    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
    const alertData = await res.json();

    alertData.forEach((alerts, index) => {
        
    })
});
}
notifyAlerts();

app.listen(port, () => console.log(`server is running on port ${port}`));