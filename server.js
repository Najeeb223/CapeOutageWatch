const express = require('express');
const port = process.env.PORT || 8000;
const webpush = require('web-push');
const sqlite3 = require('sqlite3').verbose();

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

sql = `CREATE TABLE IF NOT EXISTS alerts (
    alertId INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT,
    area TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;
db.run(sql);

const createSentAlertsTable = () => {
  const sentAlertsSql = `CREATE TABLE IF NOT EXISTS sent_alerts (
    sentAlertId INTEGER PRIMARY KEY,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`;
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
    auth TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`;

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
  try {
    const res = await fetch('https://service-alerts.cct-datascience.xyz/coct-service_alerts-current-unplanned.json');
    if (!res.ok) {
      throw new Error(`API request failed: ${res.status}`);
    }
    
    const alertData = await res.json();
    console.log(`📊 Fetched ${alertData.length} alerts from API`);

    let newAlertsCount = 0;

    for (const alert of alertData) {
      try {
        const existing = await new Promise((resolve, reject) => {
          db.get(`SELECT COUNT(*) as count FROM alerts WHERE alertId = ?`, [alert.Id], (err, row) => {
            if (err) reject(err);
            else resolve(row.count > 0);
          });
        });

        if (!existing) {
          await new Promise((resolve, reject) => {
            const insertSql = `INSERT INTO alerts(alertId, title, description, area, type) VALUES (?, ?, ?, ?, ?)`;
            db.run(insertSql, [
              alert.Id,
              alert.Title || alert.title || 'Service Alert',
              alert.Description || alert.description || alert.Problem || 'Unplanned service interruption',
              alert.Area || alert.area || alert.Location || 'Cape Town',
              alert.Type || alert.type || 'Outage'
            ], (err) => {
              if (err) reject(err);
              else {
                console.log(`✅ New alert added to DB: ${alert.Id}`);
                newAlertsCount++;
                resolve();
              }
            });
          });
        }
      } catch (error) {
        console.error(`❌ Error processing alert ${alert.Id}:`, error.message);
      }
    }

    console.log(`📈 Added ${newAlertsCount} new alerts to database`);
    return newAlertsCount;
    
  } catch (error) {
    console.error("❌ Error fetching/inserting alerts:", error.message);
    return 0; 
  }
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
      setTimeout(waitForSubscriptions, 10000);
    }
  });
};

const notifyAlerts = () => {
  const job = schedule.scheduleJob('*/10 * * * *', async () => {
    console.log("🔄 Starting scheduled alert check...");
    
    try {
      const newAlertsCount = await insertAlertsToDb();
      
      if (newAlertsCount === 0) {
        console.log("✅ No new alerts found, skipping notifications");
        return;
      }

      console.log(`🚨 Found ${newAlertsCount} new alerts - checking if they need notifications`);

      const unsentAlertsSql = `
        SELECT a.* FROM alerts a 
        LEFT JOIN sent_alerts sa ON a.alertId = sa.sentAlertId 
        WHERE sa.sentAlertId IS NULL
        ORDER BY a.created_at DESC
      `;

      db.all(unsentAlertsSql, async (err, unsentAlerts) => {
        if (err) {
          console.error("❌ Failed to fetch unsent alerts:", err.message);
          return;
        }

        if (!unsentAlerts || unsentAlerts.length === 0) {
          console.log("✅ No unsent alerts found");
          return;
        }

        console.log(`📨 Processing ${unsentAlerts.length} unsent alerts`);
        console.log("Unsent alerts:", unsentAlerts.map(a => a.alertId));

        db.all(`SELECT * FROM subscriptions`, async (err, subscriptions) => {
          if (err) {
            console.error("❌ Failed to fetch subscriptions:", err.message);
            return;
          }

          if (!subscriptions || subscriptions.length === 0) {
            console.warn("⚠️ No subscriptions found");
            return;
          }

          console.log(`👥 Ready to send to ${subscriptions.length} subscribers`);

          for (const alert of unsentAlerts) {
            try {
              const alertText = `${alert.title || ''} ${alert.description || ''}`.toLowerCase();
              const isWaterOutage = alertText.includes('water') || alertText.includes('aqua');
              const isElectricalOutage = alertText.includes('electrical') || 
                                       alertText.includes('electricity') ||
                                       alertText.includes('power') ||
                                       alertText.includes('load');

              if (!isWaterOutage && !isElectricalOutage) {
                console.log(`⏭️ Skipping non-relevant alert ${alert.alertId}: ${alert.title}`);
                await markAlertAsSent(alert.alertId);
                continue;
              }

              console.log(`🎯 Processing relevant ${isWaterOutage ? 'WATER' : 'ELECTRICAL'} alert ${alert.alertId}`);

              await markAlertAsSent(alert.alertId);

              const notificationPromises = subscriptions.map(async (sub) => {
                const subscription = {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                  }
                };

                const outageType = isWaterOutage ? '💧 Water' : '⚡ Electrical';

                const details = [alert.area, alert.location].filter(Boolean).join(" • ");
                const description = alert.description || alert.title || "Unplanned service interruption";
                
                const body = details ? `${details} • ${description}` : description;
                
                
                const deepLinkUrl = `/index.html?alertId=${alert.alertId}`; 

                const payload = JSON.stringify({
                  title: `${outageType} Outage Alert`,
                  body,
                  icon: "/images/manifest-icon-512.maskable.png",
                  badge: "/images/manifest-icon-192.maskable.png",
                  data: { 
                    url: deepLinkUrl, 
                    alertId: alert.alertId, 
                    type: isWaterOutage ? 'water' : 'electrical',
                    timestamp: Date.now()
                  },
                  actions: [
                    {
                      action: 'view',
                      title: 'View Details',
                      url: deepLinkUrl
                    }
                  ],
                  requireInteraction: true
                });

                return sendNotificationWithRetry(subscription, payload, alert.alertId);
              });

              const results = await Promise.allSettled(notificationPromises);
              const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
              console.log(`✅ Alert ${alert.alertId} sent to ${successful}/${subscriptions.length} subscribers`);

            } catch (error) {
              console.error(`❌ Error processing alert ${alert.alertId}:`, error.message);
            }
          }
        });
      });

    } catch (error) {
      console.error("❌ Error in scheduled job:", error.message);
    }
  });

  console.log("⏰ Alert monitoring job scheduled (every 10 minutes)");
};

const markAlertAsSent = (alertId) => {
  return new Promise((resolve, reject) => {
    const insertSentSql = `INSERT OR IGNORE INTO sent_alerts(sentAlertId) VALUES (?)`;
    db.run(insertSentSql, [alertId], (err) => {
      if (err) {
        console.error(`❌ Failed to mark alert ${alertId} as sent:`, err.message);
        reject(err);
      } else {
        console.log(`✅ Alert ${alertId} marked as sent`);
        resolve();
      }
    });
  });
};

const sendNotificationWithRetry = async (subscription, payload, alertId, maxAttempts = 3) => {
  let attempts = 0;

  const attempt = async () => {
    try {
      await webpush.sendNotification(subscription, payload);
      console.log(`📨 Alert ${alertId} sent successfully to ${subscription.endpoint.substring(0, 50)}...`);
      return true;
    } catch (err) {
      attempts++;
      console.error(`❌ Push error (attempt ${attempts}/${maxAttempts}):`, err.message);

      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log(`🧹 Removing stale subscription: ${subscription.endpoint.substring(0, 50)}...`);
        await new Promise((resolve) => {
          db.run(`DELETE FROM subscriptions WHERE endpoint = ?`, [subscription.endpoint], () => {
            resolve();
          });
        });
        return false;
      }

      if (attempts >= maxAttempts || (err.statusCode && err.statusCode >= 400 && err.statusCode < 500)) {
        console.error(`⚠️ Giving up on subscription: ${subscription.endpoint.substring(0, 50)}...`);
        return false;
      }

      const delay = Math.pow(2, attempts) * 1000;
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return attempt();
    }
  };

  return attempt();
};

app.listen(port, () => console.log(`🚀 Cape Outage Watch server running on port ${port}`));