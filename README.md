# BioArk Tech — Reagents and Laboratory Supplies Portal

This is the central repository for **BioArk Tech**, a premium web platform designed for managing, searching, and request quotes for biological reagents and laboratory consumables.

The project is fully containerized using **Docker Compose**, integrating a modern React frontend, a robust Django backend, and a PostgreSQL database.

---

## 🚀 Prerequisites

Make sure you have the following installed on your system:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (including Docker Compose)
* Git

---

## 🛠️ Project Architecture

The application environment consists of three main Docker services:

1. **`bioark_postgres` (Database):**
   * Engine: PostgreSQL 16.
   * Initialization: Automatically imports the database dump file `backend/bioarktech.sql` on the first startup, ensuring the complete product catalog, categories, images, and user setup are available immediately.
2. **`bioark_backend` (Backend API):**
   * Framework: Django + Django REST Framework.
   * Ports: Exposed at `http://localhost:8000`.
   * Responsibilities: User authentication, search APIs with category filtering support, shipping cost classification, and SMTP email processing for quotes.
3. **`bioark_frontend` (Frontend Web):**
   * Framework: React + Vite (structured modularly under `/components` and `/pages`).
   * Ports: Exposed at `http://localhost:5173`.
   * Styling: Pure CSS utilizing modern variables, gradients, and micro-animations (No TailwindCSS).

---

## 🚦 Getting Started (How to Run)

Choose the environment you want to spin up:

### 💻 Local Development (React Port 5173)
Open your terminal in the root directory of the project and execute:
```bash
docker compose -f docker-compose.local.yml up --build -d
```
Once the containers are up and running, you can access:
* **Frontend Web:** [http://localhost:5173](http://localhost:5173)
* **Admin Console:** [http://localhost:5173/admin](http://localhost:5173/admin)
* **Backend REST API:** [http://localhost:8000](http://localhost:8000)

---

### 🌐 Production/Staging (Standard Web Port 80)
Open your terminal in the root directory of the project and execute:
```bash
docker compose up --build -d
```
Once the containers are up and running, you can access:
* **Frontend Web:** [http://localhost:80](http://localhost:80)
* **Admin Console:** [http://localhost:80/admin](http://localhost:80/admin)
* **Backend REST API:** [http://localhost:8000](http://localhost:8000)


---

## 📦 Inventory & Shipping Business Rules

### 1. Reagents vs. Consumables Classification
The inventory catalog is divided into two primary product types through backend API serialization:
* **Reagents & Kits ($40 USD shipping):** Includes enzymes, proteins, DNA markers, protein ladders, transfection reagents, and qPCR master mixes. These items generally require specialized shipping conditions (wet ice or dry ice).
* **Consumables & Supplies ($100 USD shipping):** Includes cryogenic boxes, sterile cryogenic vials, serological pipettes, cell culture dishes, flasks, cell culture plates, qPCR plates, centrifuge tubes, pipette tips, and nitrile gloves.

### 2. Flat Rate Shipping Logic
Shipping costs are calculated as a **single flat fee for the entire order** (it does not compound per item or per quantity):
* If the cart contains **at least one consumable**, the flat shipping fee for the entire order is **$100.00 USD**.
* If the cart contains **only reagents** (and no consumables), the flat shipping fee is **$40.00 USD**.
* If the cart is empty, the shipping fee is **$0.00 USD**.

---

## ⚙️ Maintenance & Useful Commands

### Manage Services
* **Start the stack:**
  * Local: `docker compose -f docker-compose.local.yml up -d`
  * Prod: `docker compose up -d`
* **Stop the stack (keeps data volume):**
  * Local: `docker compose -f docker-compose.local.yml down`
  * Prod: `docker compose down`
* **Quick restart:**
  * Local: `docker compose -f docker-compose.local.yml restart`
  * Prod: `docker compose restart`

### Reset the Database from Scratch
If you want to clear all database volumes and force a fresh initialization using the `backend/bioarktech.sql` dump file:
```bash
# For Local Development:
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d

# For Production:
docker compose down -v
docker compose up -d
```

### Monitor Live Logs
* **Stream all logs:** `docker compose logs -f` (add `-f docker-compose.local.yml` for local)
* **Stream Backend logs only:** `docker compose logs -f backend`
* **Stream Frontend logs only:** `docker compose logs -f frontend`


---

## 📁 Source Code Directory Structure (Frontend)

* `/src/components/`: Reusable UI components (headers, footer, auth modal, product icons, etc.).
* `/src/pages/`: Page-level components:
  * `HomePage.jsx`: Hero carousels, category grid, and latest blogs.
  * `SearchPage.jsx`: Dynamic product catalog with Category Tabs (All, Reagents, Consumables), A-Z/Z-A/Price sorting, search text filtering, and shipping badges.
  * `ProductDetailsPage.jsx`: Technical specifications and file downloads for product manuals.
  * `CartPage.jsx`: Shopping cart details featuring the single order-level flat shipping fee summary.
  * `RequestQuotePage.jsx`: Customized quote request form auto-populated with cart listings.
  * `AdminPage.jsx`: Consolidated admin console containing User lists, SMTP mail configuration, and HTML email templates.
* `/src/utils/api.js`: Centralized fetch helper managing cookies, API domain, and CSRF token handshakes.
