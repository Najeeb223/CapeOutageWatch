const express = require('express');
const port = process.env.PORT || 8000;
const webpush = require('web-push');
const sqlite3 = require('sqlite3').verbose();

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

let sql;
const db = new sqlite3.Database('./capeoutagewatch.db', sqlite3.OPEN_READWRITE, (err) => {
        if(err) return console.error(err.message);
});
sql = `CREATE TABLE IF NOT EXISTS alerts (alertId INTEGER PRIMARY KEY)`;
db.run(sql);
/*
app.use(bodyParser.json()); // Use body-parser to parse JSON requests

    app.post('/save-subscription', (req, res) => {
        const subscription = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        const { endpoint } = subscription;
        const { p256dh, auth } = subscription.keys;

        // Insert the subscription into the database
        db.run(`INSERT OR IGNORE INTO subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)`,
            [endpoint, p256dh, auth],
            function (err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to save subscription' });
                }
                res.status(201).json({ message: 'Subscription saved successfully', id: this.lastID });
            }
        );
    });

*/

const saveSubscriptions = () => {
    
    sql = `CREATE TABLE IF NOT EXISTS subscriptions (PRIMARY KEY endpoint, p256dh, auth)`;
    db.run(sql);
    app.post('/save-subscription', (req, res) => {
        const subscription = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        const { endpoint } = subscription;
        const { p256dh, auth } = subscription.keys;

        db.run(`INSERT OR IGNORE INTO subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)`,
            [endpoint, p256dh, auth],
            function (err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to save subscription' });
                }
                res.status(201).json({ message: 'Subscription saved successfully', id: this.lastID });
            }
        );
    });
}
saveSubscriptions();




const insertAlertsToDb = async () => {
    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
    const alertData = await res.json();

    alertData.forEach(alert => {
        const checkSql = `SELECT COUNT(*) as count FROM alerts WHERE alertId = ?`;
        db.get(checkSql, [alert.Id], (err, row) => {
            if (err) return console.error(err.message);
            if (row.count === 0) {
                const insertSql = `INSERT INTO alerts(alertId) VALUES (?)`;
                db.run(insertSql, [alert.Id], err => {
                    if (err) console.error(err.message);
                });
            }
        });
    });
};
insertAlertsToDb();


const notifyAlerts = () => {
    const sentAlertsSql = `CREATE TABLE IF NOT EXISTS sent_alerts (sentAlertId INTEGER PRIMARY KEY)`;
    db.run(sentAlertsSql);

    const job = schedule.scheduleJob('*/10 * * * *', async () => {
        try {
            const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
            const alertData = await res.json();

            alertData.forEach(alert => {
                const checkSql = `SELECT COUNT(*) as count FROM sent_alerts WHERE sentAlertId = ?`;
                db.get(checkSql, [alert.Id], (err, row) => {
                    if (err) return console.error(err.message);
                    if (row.count === 0) {
                        // Insert the new alert ID into sent_alerts
                        const insertNewAlertSql = `INSERT INTO sent_alerts(sentAlertId) VALUES (?)`;
                        db.run(insertNewAlertSql, [alert.Id], err => {
                            if (err) return console.error(err.message);
                        });

                        // Get all subscriptions
                        db.all(`SELECT * FROM subscriptions`, (err, subscriptions) => {
                            if (err) return console.error("Failed to fetch subscriptions:", err.message);
                            if (!subscriptions || subscriptions.length === 0) {
                                console.warn("No subscriptions found");
                                return;
                            }

                            // Send notification to each subscription
                            subscriptions.forEach(sub => {
                                const subscription = {
                                    endpoint: sub.endpoint,
                                    keys: {
                                        p256dh: sub.p256dh,
                                        auth: sub.auth
                                    }
                                };

                                webpush.sendNotification(subscription, "🚨 New COCT Unplanned Alert")
                                    .then(() => console.log("Notification sent to:", subscription.endpoint))
                                    .catch(err => console.error("Push error:", err));
                            });
                        });
                    }
                });
            });
        } catch (error) {
            console.error("Error in notifyAlerts job:", error.message);
        }
    });
};

notifyAlerts();



app.listen(port, () => console.log(`server is running on port ${port}`));