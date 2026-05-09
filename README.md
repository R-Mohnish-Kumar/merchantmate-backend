# MerchantMate Backend Server

MerchantMate Backend is a Node.js and Express REST API server built for the MerchantMate Android POS application. It provides secure merchant authentication, product management, checkout processing, receipt/transaction storage, dashboard summaries, smart sales insights, and merchant profile support.

The backend uses Firebase Admin SDK to verify Firebase Authentication ID tokens from the Android app and stores each merchant's data separately in Cloud Firestore.

---

## Project Purpose

MerchantMate is designed for micro-merchants and small businesses that need a lightweight POS-style system. The backend acts as the secure service layer between the Android app and Firebase Firestore.

It handles:

- Merchant authentication verification
- Multi-merchant data isolation
- Product CRUD operations
- Cart checkout processing
- Stock reduction after checkout
- Transaction and receipt generation
- Dashboard summary calculations
- Daily smart insights
- Merchant profile management

---

## Tech Stack

- Node.js
- Express.js
- Firebase Admin SDK
- Cloud Firestore
- Firebase Authentication
- dotenv
- CORS
- Nodemon for development

---

## Architecture

```text
Android App
   |
   | Retrofit REST API calls
   | Authorization: Bearer <Firebase_ID_Token>
   |
Node.js / Express Backend
   |
   | Firebase Admin SDK verifies token
   |
Cloud Firestore
```

---

## Authentication Flow

```text
1. Merchant logs in through Firebase Auth on Android
2. Android receives a Firebase ID token
3. Android sends the token in each protected API request
4. Backend reads the Authorization header
5. Firebase Admin SDK verifies the token
6. Backend extracts the authenticated user uid
7. uid is used as merchantId
8. Merchant data is read/written under merchants/{merchantId}
```

Protected request format:

```http
Authorization: Bearer <Firebase_ID_Token>
```

---

## Firestore Data Structure

```text
merchants
 └── {merchantId}
      ├── profile
      │    └── details
      ├── products
      │    └── {productId}
      └── transactions
           └── {transactionId}
```

This structure ensures each merchant only accesses their own products, transactions, profile, dashboard data, and insights.

---

## Main Features

### Product Management

- Create products
- Read all merchant products
- Update product details
- Delete products
- Store product name, category, price, stock, and timestamps

### Checkout

- Accepts cart items from the Android app
- Validates payment method
- Calculates total order amount
- Creates transaction record
- Generates receipt ID
- Reduces product stock
- Stores payment method and checkout status

### Transactions and Receipts

- Stores completed checkout records
- Returns transaction history
- Includes receipt ID, total, payment method, status, items, and timestamp

### Dashboard Summary

- Calculates today’s revenue
- Calculates total transaction count
- Calculates average order value
- Calculates weekly sales values
- Identifies best-selling product
- Returns recent transactions

### Smart Insights

- Top seller of the day
- Low-stock product alerts
- Slow-moving products
- Average order value
- Revenue comparison with previous day
- Suggested merchant actions

### Profile

- Stores merchant owner name, business name, email, phone, business type, and currency
- Used by the Android dashboard greeting
- Supports profile creation and update

---

## Folder Structure

```text
backend
│
├── src
│   ├── config
│   │   └── firebase.js
│   │
│   ├── controllers
│   │   ├── productController.js
│   │   ├── checkoutController.js
│   │   ├── transactionController.js
│   │   ├── dashboardController.js
│   │   ├── insightController.js
│   │   └── profileController.js
│   │
│   ├── middleware
│   │   └── authMiddleware.js
│   │
│   ├── routes
│   │   ├── productRoutes.js
│   │   ├── checkoutRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── insightRoutes.js
│   │   └── profileRoutes.js
│   │
│   ├── utils
│   │   ├── calculations.js
│   │   ├── merchantCollections.js
│   │   └── response.js
│   │
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

The exact filenames may vary slightly depending on your final implementation.

---

## Environment Variables

Create a `.env` file in the backend root:

```env
PORT=5000
DEV_AUTH_BYPASS=false
DEV_MERCHANT_ID=test-merchant-001
```

### Development Auth Bypass

For quick local testing with Postman, you can temporarily use:

```env
DEV_AUTH_BYPASS=true
DEV_MERCHANT_ID=test-merchant-001
```

When enabled, the backend skips Firebase token verification and uses the configured test merchant ID.

Important: Do not enable `DEV_AUTH_BYPASS=true` in production.

---

## Firebase Setup

This backend requires Firebase Admin SDK.

You need:

- A Firebase project
- Firebase Authentication enabled
- Cloud Firestore enabled
- A Firebase service account key or Admin SDK configuration

The backend should initialise Firebase Admin inside:

```text
src/config/firebase.js
```

Example responsibility of this file:

```text
- Import firebase-admin
- Load service account or application credentials
- Initialise Firebase Admin app
- Export Firestore database instance
- Export Firebase Admin instance
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/R-Mohnish-Kumar/Merchant-Mate-POS-Android-App.git
```

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create your `.env` file:

```bash
touch .env
```

Add the required environment variables.

---

## Running the Server

For development:

```bash
npm run dev
```

For production/start script:

```bash
npm start
```

The backend should run on:

```text
http://localhost:5000
```

For Android Emulator, the Android app should call:

```text
http://10.0.2.2:5000/
```

---

## API Endpoints

### Health Check

```http
GET /
```

Example response:

```json
{
  "success": true,
  "message": "MerchantMate API is running"
}
```

---

## Product Endpoints

### Get Products

```http
GET /api/products
```

Headers:

```http
Authorization: Bearer <Firebase_ID_Token>
```

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": "product123",
      "name": "Cranberry Juice",
      "category": "Drinks",
      "price": 4.2,
      "stock": 20
    }
  ]
}
```

### Add Product

```http
POST /api/products
```

Request body:

```json
{
  "name": "Cranberry Juice",
  "category": "Drinks",
  "price": 4.2,
  "stock": 20
}
```

### Update Product

```http
PUT /api/products/:id
```

Request body:

```json
{
  "name": "Orange Juice",
  "category": "Drinks",
  "price": 3.8,
  "stock": 15
}
```

### Delete Product

```http
DELETE /api/products/:id
```

---

## Checkout Endpoint

### Create Checkout

```http
POST /api/checkout
```

Request body:

```json
{
  "items": [
    {
      "productId": "product123",
      "name": "Cranberry Juice",
      "price": 4.2,
      "quantity": 2
    }
  ],
  "paymentMethod": "CARD"
}
```

Allowed payment methods:

```text
CASH
CARD
```

Example response:

```json
{
  "success": true,
  "message": "Checkout completed successfully",
  "data": {
    "transactionId": "txn123",
    "receiptId": "RCPT-20260509-001",
    "total": 8.4,
    "paymentMethod": "CARD",
    "status": "COMPLETED"
  }
}
```

---

## Transaction Endpoints

### Get Transactions

```http
GET /api/transactions
```

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": "txn123",
      "receiptId": "RCPT-20260509-001",
      "total": 8.4,
      "paymentMethod": "CARD",
      "status": "COMPLETED"
    }
  ]
}
```

---

## Dashboard Endpoint

### Get Dashboard Summary

```http
GET /api/dashboard/summary
```

Example response:

```json
{
  "success": true,
  "data": {
    "todayRevenue": 331.2,
    "transactionCount": 9,
    "averageOrderValue": 36.8,
    "bestSellingProduct": {
      "productId": "product123",
      "name": "Cranberry Juice",
      "quantitySold": 19,
      "revenue": 79.8
    },
    "recentTransactions": []
  }
}
```

---

## Insights Endpoint

### Get Today’s Insights

```http
GET /api/insights/today
```

Example response:

```json
{
  "success": true,
  "data": {
    "topSeller": {
      "productId": "product123",
      "productName": "Cranberry Juice",
      "quantitySold": 19,
      "revenue": 79.8,
      "message": "Cranberry Juice is your top seller today."
    },
    "lowStock": [],
    "slowMoving": [],
    "averageOrderValue": 36.8,
    "revenueComparison": {
      "todayRevenue": 331.2,
      "yesterdayRevenue": 245.0,
      "percentageChange": 35.18,
      "message": "Revenue is up compared with yesterday."
    },
    "suggestedActions": [
      "Restock low-stock products",
      "Promote slow-moving items"
    ]
  }
}
```

---

## Profile Endpoints

### Get Profile

```http
GET /api/profile
```

Example response:

```json
{
  "success": true,
  "data": {
    "uid": "merchantUid123",
    "ownerName": "Mohnishkumar",
    "businessName": "MKR Mini Store",
    "email": "merchant@example.com",
    "phone": "+44 0000 000000",
    "businessType": "Retail",
    "currency": "GBP"
  }
}
```

### Update Profile

```http
PUT /api/profile
```

Request body:

```json
{
  "ownerName": "Mohnishkumar",
  "businessName": "MKR Mini Store",
  "phone": "+44 0000 000000",
  "businessType": "Retail",
  "currency": "GBP"
}
```

---

## Standard API Response Format

Successful response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

---

## Important Backend Utilities

### `authMiddleware.js`

Responsible for:

- Reading the `Authorization` header
- Extracting the Firebase ID token
- Verifying token with Firebase Admin SDK
- Attaching authenticated user data to `req.user`
- Supporting optional development auth bypass

### `merchantCollections.js`

Responsible for returning merchant-specific Firestore collection references, such as:

```text
merchants/{merchantId}/products
merchants/{merchantId}/transactions
```

### `calculations.js`

Responsible for reusable business calculations, such as:

- Order total
- Average order value
- Revenue comparison percentage
- Best-selling product logic
- Low-stock detection
- Slow-moving product detection

### `response.js`

Responsible for consistent API response formatting.

---

## Testing with Postman

For quick testing:

1. Set `DEV_AUTH_BYPASS=true` in `.env`
2. Restart the backend server
3. Use the endpoints directly from Postman
4. Confirm Firestore records are created under:

```text
merchants/test-merchant-001/products
merchants/test-merchant-001/transactions
```

For real Firebase Auth testing:

1. Login from Android app
2. Allow the app to send Firebase ID token
3. Backend verifies token
4. Data is stored under the actual Firebase user uid

---

## Android Integration Notes

The Android app uses Retrofit with base URL:

```kotlin
private const val BASE_URL = "http://10.0.2.2:5000/"
```

For every protected API call, the Android `AuthInterceptor` adds:

```http
Authorization: Bearer <Firebase_ID_Token>
```

The backend then uses this token to identify the merchant.

---

## Common Issues and Fixes

### 401 Unauthorized

Possible causes:

- Missing Authorization header
- Expired Firebase token
- Firebase Admin SDK not configured correctly
- Android user not logged in
- `DEV_AUTH_BYPASS=false` while testing from Postman without a token

### Payment method validation error

Use only:

```text
CARD
CASH
```

### Android emulator cannot connect to backend

Use:

```text
http://10.0.2.2:5000/
```

not:

```text
http://localhost:5000/
```

### Firestore data not visible where expected

Check whether auth bypass is enabled. With bypass, data is stored under:

```text
merchants/test-merchant-001
```

With real Firebase Auth, data is stored under:

```text
merchants/{firebaseAuthUid}
```

---

## Security Notes

- Never commit Firebase service account keys to GitHub
- Keep `.env` out of version control
- Disable `DEV_AUTH_BYPASS` in production
- Always verify Firebase ID tokens on protected routes
- Validate request body inputs before writing to Firestore
- Use merchant-specific Firestore paths to prevent data leakage

---

## Suggested `.gitignore`

```gitignore
node_modules/
.env
serviceAccountKey.json
firebase-service-account.json
.DS_Store
npm-debug.log
```

---

## Future Improvements

- Real payment provider integration
- Refund endpoint
- Receipt PDF generation
- Email receipt support
- Inventory alerts
- Monthly and weekly analytics
- CSV export for transactions
- Staff accounts and role-based access
- Cloud deployment
- Automated API tests
- Request validation using Joi or Zod
- Rate limiting and API security hardening

---

## Project Pitch

MerchantMate Backend is a secure Express.js API server for a smart POS Android application. It verifies Firebase Authentication tokens, isolates each merchant's data in Firestore, manages products and transactions, processes mock checkouts, and generates dashboard insights that help micro-merchants understand their daily sales performance.

---

## Author

**Mohnishkumar Rajkumar**  
MSc Artificial Intelligence  
Birmingham City University

GitHub: [R-Mohnish-Kumar](https://github.com/R-Mohnish-Kumar)

---

## License

This backend server was developed for academi and portfolio purposes.
