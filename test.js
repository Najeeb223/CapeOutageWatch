/* Test notification for debugging

app.get("/send-notification", (req, res) => {
    db.get(`SELECT * FROM subscriptions LIMIT 1`, (err, row) => {
        if (err) {
            console.error("DB error:", err.message);
            return res.status(500).json({ error: "Failed to fetch subscription" });
        }

        if (!row) {
            console.warn("No subscriptions found in DB");
            return res.status(404).json({ error: "No subscriptions found" });
        }

        const subscription = {
            endpoint: row.endpoint,
            keys: {
                p256dh: row.p256dh,
                auth: row.auth
            }
        };

        webpush.sendNotification(subscription, "Test Notification")
            .then(() => {
                console.log("Test notification sent");
                res.json({ status: "Success", message: "Test push sent" });
            })
            .catch(err => {
                console.error("Push failed:", err);
                res.status(500).json({ error: "Push failed" });
            });
    });
});

*/