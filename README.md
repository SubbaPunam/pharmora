# 💊 Pharmora — MySQL Edition

Full-stack pharmacy website converted from MongoDB → MySQL.  
Same design, same features, new database.

---

## 📁 Project Structure

```
pharmora_mysql/
├── backend/
│   ├── config/
│   │   ├── db.js           ← MySQL pool connection
│   │   └── schema.sql      ← Run this FIRST to create tables
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── medicineController.js
│   │   └── orderController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── medicineRoutes.js
│   │   └── orderRoutes.js
│   ├── utils/
│   │   └── seed.js         ← Seeds admin + 12 medicines
│   ├── .env                ← ← ← Edit your MySQL credentials here
│   ├── package.json
│   └── server.js
│
└── frontend/
    └── client/
        ├── index.html          ← Home / product listing
        ├── login.html          ← Login (redirects to cart after checkout)
        ├── register.html       ← Registration
        ├── cart.html           ← Cart with "Proceed to Checkout"
        ├── order-success.html  ← ✅ "Order Successful" page
        ├── dashboard.html      ← Dashboard with Orders tab
        ├── style.css
        ├── cart.css
        ├── dashboard.css
        ├── register.css
        ├── script.js           ← Home page JS (products, cart, search)
        ├── cart.js             ← Cart JS (checkout → login flow)
        └── images/             ← Medicine images
```

---

## ⚡ Quick Setup (5 steps)

### Step 1 — Create MySQL Database

Open MySQL Workbench / phpMyAdmin / terminal and run:

```sql
-- Copy-paste the entire contents of backend/config/schema.sql
```

Or via terminal:
```bash
mysql -u root -p < backend/config/schema.sql
```

### Step 2 — Configure `.env`

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password   ← change this!
DB_NAME=pharmora
JWT_SECRET=pharmora_super_secret_jwt_key_change_this_in_production_2025
```

### Step 3 — Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 4 — Seed the Database

```bash
npm run seed
```

This creates:
- **Admin account**: `admin@pharmora.com` / `Admin@1234`
- **12 medicines** with images, prices, categories

### Step 5 — Start the Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server starts on **http://localhost:5000**

### Step 6 — Open the Frontend

Open `frontend/client/index.html` in your browser  
*(use VS Code Live Server for best results)*

---

## 🔄 Complete User Flow

```
index.html          Browse medicines, add to cart
    ↓
cart.html           Review cart → click "Proceed to Checkout"
    ↓
login.html          (if not logged in) → banner shows "Sign in to complete order"
    ↓  login success
cart.html           Auto-places order via API
    ↓  success
order-success.html  🎉 Confetti + order details shown
    ↓  click "View My Orders"
dashboard.html      Orders tab shows all orders with status, cancel button
```

---

## 🗄️ MySQL Tables

| Table         | Purpose                          |
|---------------|----------------------------------|
| `users`       | Registered users & admins        |
| `medicines`   | Medicine catalog with stock      |
| `orders`      | Order headers (totals, status)   |
| `order_items` | Individual items per order       |

---

## 🔌 API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/register          | Create account           |
| POST   | /api/auth/login             | Login → returns JWT      |
| GET    | /api/medicines              | List all medicines       |
| GET    | /api/medicines?category=pain| Filter by category       |
| POST   | /api/orders                 | Place order (auth req)   |
| GET    | /api/orders/my              | Get my orders (auth req) |
| PATCH  | /api/orders/:id/cancel      | Cancel order (auth req)  |

---

## 🐛 Troubleshooting

**"ER_ACCESS_DENIED_ERROR"** → Wrong DB_USER / DB_PASSWORD in `.env`  
**"Unknown database pharmora"** → Run `schema.sql` first  
**CORS errors in browser** → Make sure backend is running on port 5000  
**Images not showing** → Open via Live Server (not file://)  
**Demo mode** → If backend is offline, the site still works with localStorage fallback
