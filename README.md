# 🚨 CapeOutageWatch (COW)

> A Progressive Web App (PWA) built to notify Cape Town residents of unplanned water outages through real-time push notifications.

## 📖 Why I Built It

As a Cape Town resident, I experienced multiple sudden water outages without any clear reason or estimated duration. The most common way to find out about outages was through **WhatsApp group chats** or third party tools like ESP (mainly focused on electricity), which left a huge gap in **real-time outage visibility**.

I began researching how outage information was actually disseminated and discovered that the **City of Cape Town provides a public-facing service alerts API** with structured JSON data and documentation on [GitHub](https://github.com/cityofcapetown/service-alerts-connector).


---

## 🧪 What It Does

* 📲 Sends **push notifications** when the City publishes new unplanned water or electricity outage alerts
* 🗺️ Displays **location and service details** in the notification payload
* ⚡ Uses a **service worker** to keep users informed in real time
* 🧭 Lightweight UI inspired by ESP’s load-shedding app, built for speed and simplicity

---

## 🧰 Tech Stack

* **Frontend:** Vanilla JS, HTML, CSS
* **Backend:** Node.js + Express
* **Database:** SQLite
* **Push Notifications:** Web Push API + Service Workers
* **Deployment:** Render
* **Data Source:** [City of Cape Town Alerts API](https://github.com/cityofcapetown/service-alerts-connector)

---

## 🚀 Roadmap

* 🔹 **Migrate backend** to Spring Boot for more robustness and better scalability
* 🔹 Add **search functionality** to view alerts by area or type
* 🔹 Improve notification customization for users

---

## 🤝 Acknowledgements

* [City of Cape Town](https://github.com/cityofcapetown) for their transparent, well-documented public alerts API
* Gordon (Lead Data Engineer) for valuable insight into their verification and alerting process

---

## 🌐 Live Demo

👉 [capeoutagewatch.onrender.com](https://capeoutagewatch.onrender.com/)


