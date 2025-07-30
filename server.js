const express = require('express');
const port = process.env.PORT || 8000;
const webpush = require('web-push');
const sqlite3 = require('sqlite3').verbose();

//utility to help with file paths
const path = require('path');

const app = express();
const cors = require("cors");
app.use(cors());


const apiKeys = {
    publicKey: "BKFjG_8SqCnVM0QHL_xSni4szqp-ELnkhK6JxsE7VWbhTM8d5CF0Yu4zjb-qFMcRWEf0PGo7SSiiD0R7w_XLakU",
    privateKey: "mV6oxKlW1Gq3Ss1eMoxDN0pp1rKiGi_8Ym5MYH-tY-0"
}

webpush.setVapidDetails(
    'mailto:najeebwarsame@gmail.com',
    apiKeys.publicKey,
    apiKeys.privateKey

)

app.use(express.static(__dirname));

app.use(express.json());
const schedule = require('node-schedule');


app.get("/", (req, res) => {
    res.send("Hello World");
})

let sql;
const dbPath = path.resolve(__dirname, 'capeoutagewatch.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        return console.error("❌ DB connection error:", err.message);
    }
    console.log("✅ Connected to SQLite DB at:", dbPath);
    saveSubscriptions();
});

sql = `CREATE TABLE IF NOT EXISTS alerts (alertId INTEGER PRIMARY KEY)`;
db.run(sql);

const createSentAlertsTable = () => {
  const sentAlertsSql = `CREATE TABLE IF NOT EXISTS sent_alerts (sentAlertId INTEGER PRIMARY KEY)`;
  db.run(sentAlertsSql, (err) => {
    if (err) {
      console.error("❌ Failed to create sent_alerts table:", err.message);
    } else {
      console.log("✅ sent_alerts table created (or already exists)");
    }
  });
};
createSentAlertsTable();

const saveSubscriptions = () => {
  const sql = `CREATE TABLE IF NOT EXISTS subscriptions (
    endpoint TEXT PRIMARY KEY,
    p256dh TEXT,
    auth TEXT
  )`;

  // Create the subscriptions table and handle any creation errors
  db.run(sql, (err) => {
    if (err) {
      console.error("❌ Failed to create subscriptions table:", err.message);
    } else {
      console.log("✅ Subscriptions table created (or already exists)");
    }
  });

  app.post('/save-subscription', (req, res) => {
    const subscription = req.body;
    console.log("📩 Incoming subscription POST request:");
    console.log(JSON.stringify(subscription, null, 2));

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    const { endpoint } = subscription;
    const { p256dh, auth } = subscription.keys;

    db.run(
      `INSERT INTO subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
      [endpoint, p256dh, auth],
      function (err) {
        if (err) {
          console.error("❌ Failed to save subscription:", err.message);
          return res.status(500).json({ error: 'Failed to save subscription' });
        }
        res.status(201).json({
          message: 'Subscription saved successfully',
          id: this.lastID,
        });
      }
    );
  });
};






const insertAlertsToDb = async () => {
  const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
  const alertData = await res.json();

  const insertPromises = alertData.map(alert => {
      return new Promise((resolve, reject) => {
          const checkSql = `SELECT COUNT(*) as count FROM alerts WHERE alertId = ?`;
          db.get(checkSql, [alert.Id], (err, row) => {
              if (err) return reject(err);
              if (row.count === 0) {
                  const insertSql = `INSERT INTO alerts(alertId) VALUES (?)`;
                  db.run(insertSql, [alert.Id], err => {
                      if (err) return reject(err);
                      resolve();
                  });
              } else {
                  resolve(); 
              }
          });
      });
  });

  await Promise.all(insertPromises);
};

insertAlertsToDb().then(() => waitForSubscriptions());


const waitForSubscriptions = () => {
  db.get(`SELECT COUNT(*) as count FROM subscriptions`, (err, row) => {
    if (err) {
      console.error("❌ Failed to check subscriptions:", err.message);
      return;
    }

    if (row.count > 0) {
      console.log("✅ Subscriptions found, starting alert job...");
      notifyAlerts();
    } else {
      console.warn("⏳ Waiting for at least one subscription...");
      setTimeout(waitForSubscriptions, 10000); // retry in 10 seconds
    }
  });
};



const notifyAlerts = () => {


  const job = schedule.scheduleJob('*/10 * * * *', async () => {
    try {
      await insertAlertsToDb();

      db.all(`SELECT * FROM alerts`, (err, alertData) => {
        if (err) {
          console.error("❌ Failed to fetch alerts from DB:", err.message);
          return;
        }

        if (!alertData || alertData.length === 0) {
          console.warn("⚠️ No alerts found in DB.");
          return;
        }

        alertData.forEach(alert => {
          const checkSql = `SELECT COUNT(*) as count FROM sent_alerts WHERE sentAlertId = ?`;
          db.get(checkSql, [alert.Id], (err, row) => {
            if (err) return console.error("❌ Check alert error:", err.message);
            if (row.count === 0) {
              const insertNewAlertSql = `INSERT INTO sent_alerts(sentAlertId) VALUES (?)`;
              db.run(insertNewAlertSql, [alert.Id], err => {
                if (err) return console.error("❌ Insert sent_alert failed:", err.message);
              });

              db.all(`SELECT * FROM subscriptions`, (err, subscriptions) => {
                if (err) return console.error("❌ Failed to fetch subscriptions:", err.message);
                if (!subscriptions || subscriptions.length === 0) {
                  console.warn("⚠️ No subscriptions found.");
                  return;
                }

                subscriptions.forEach(sub => {
                  const subscription = {
                    endpoint: sub.endpoint,
                    keys: {
                      p256dh: sub.p256dh,
                      auth: sub.auth
                    }
                  };

                  const maxAttempts = 3;
                  let attempts = 0;

                  const sendWithRetry = async () => {
                    try {
                      const payload = JSON.stringify({
                        title: alert.title || "Cape Outage Alert",
                        body: alert.description || "New unplanned water outage reported by City of Cape Town.",
                        icon: "/images/manifest-icon-512.maskable.png",
                        data: { url: `/alerts/${alert.Id}` }
                      });

                      await webpush.sendNotification(subscription, payload);
                      console.log(`📨 Alert ${alert.Id} sent to ${subscription.endpoint}`);
                    } catch (err) {
                      attempts++;
                      console.error(`❌ Push error (attempt ${attempts}):`, err);

                      // Clean up stale subscriptions
                      if (err.statusCode === 404 || err.statusCode === 410) {
                        db.run(`DELETE FROM subscriptions WHERE endpoint = ?`, [subscription.endpoint], (delErr) => {
                          if (delErr) {
                            console.error("❌ Failed to delete stale subscription:", delErr.message);
                          } else {
                            console.log(`🧹 Deleted stale subscription: ${subscription.endpoint}`);
                          }
                        });
                        return;
                      }

                      if (attempts >= maxAttempts || (err.statusCode && err.statusCode < 500)) {
                        console.error("⚠️ Giving up on:", subscription.endpoint);
                        return;
                      }

                      const delay = Math.pow(2, attempts) * 1000;
                      console.log(`⏳ Retrying in ${delay}ms...`);
                      setTimeout(sendWithRetry, delay);
                    }
                  };

                  sendWithRetry();
                });
              });
            }
          });
        });
      });
    } catch (error) {
      console.error("❌ Error in notifyAlerts job:", error.message);
    }
  });
};





app.listen(port, () => console.log(`server is running on port ${port}`));