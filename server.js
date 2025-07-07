const express = require('express');
const port = process.env.PORT || 8000;
const webpush = require('web-push');

//utility to help with file paths
const path = require('path');

const app = express();
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

const subDatabase = [];
app.post("/save-subscription", (req, res) => {
    subDatabase.push(req.body);
    res.josn({ status: "Success", message: "Subscription saved!" });
})

app.get("/send-notification", (req, res) => {
    webpush.sendNotification(subDatabase[0], "Hello World");
    res.json({ "status": "Success", "message": "Message sent to the push service" });
})


app.listen(port, () => console.log(`server is running on port ${port}`));