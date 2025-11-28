# Party Rental Backend - Firebase & Stripe

This backend uses **Firebase Firestore** for data storage and **Stripe** for payment processing.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the downloaded JSON file as `firebase-service-account.json` in the backend folder
6. Or copy the entire JSON content as a string to your `.env` file as `FIREBASE_SERVICE_ACCOUNT`

### 3. Firestore Database Setup

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Production mode** or **Test mode**
4. Select a location close to your users

The following collections will be created automatically:
- `orders` - Stores all rental orders
- `customers` - Stores customer information
- `sales` - Records completed sales

### 4. Environment Variables

Create a `.env` file in the backend folder:

```env
PORT=4000
STRIPE_SECRET_TEST=sk_test_your_stripe_secret_key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### 5. Run the Server

Development mode with auto-reload:
```bash
npm start
```

Production mode:
```bash
npm run prod
```

## API Endpoints

### Orders

**POST** `/api/orders`
- Create a new rental order
- Body: Order details including customer info, cart, delivery method, etc.
- Returns: `{ success, orderId }`

**GET** `/api/orders/:orderId`
- Get order details by ID
- Returns: Order object with all details

**GET** `/api/customers/:email/orders`
- Get all orders for a customer
- Returns: Array of orders

### Payments

**POST** `/api/create-payment-intent`
- Create Stripe payment intent
- Body: `{ amount, orderId, customerEmail }`
- Returns: `{ clientSecret, paymentIntentId }`

**POST** `/api/confirm-payment`
- Confirm payment and update order status
- Body: `{ orderId, paymentIntentId }`
- Updates order status to 'confirmed' and creates sale record

### Sales (Admin)

**GET** `/api/sales`
- Get all sales records
- Query params: `startDate`, `endDate`, `limit`
- Returns: Array of sales with totals

## Database Schema

### Orders Collection
```javascript
{
  customerInfo: {
    name, email, phone, address
  },
  deliveryMethod: 'pickup' | 'delivery',
  deliveryCity: { id, name, state },
  eventDates: [startDate, endDate],
  eventTime: 'morning' | 'afternoon',
  deliveryTime: string,
  rentalDays: number,
  cart: [{
    productId, productName, productType,
    quantity, pricePerUnit, totalPrice
  }],
  pricing: {
    subtotal, deliveryCost, pickupFee, total
  },
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  paymentStatus: 'pending' | 'paid' | 'refunded',
  paymentIntentId: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  paidAt: timestamp
}
```

### Customers Collection
```javascript
{
  name: string,
  email: string (document ID),
  phone: string,
  addresses: [string],
  totalOrders: number,
  createdAt: timestamp,
  lastOrderAt: timestamp
}
```

### Sales Collection
```javascript
{
  orderId: string,
  customerEmail: string,
  customerName: string,
  total: number,
  paymentIntentId: string,
  eventDate: string,
  rentalDays: number,
  deliveryMethod: string,
  saleDate: timestamp
}
```

## Features

✅ **Firebase Firestore** for all data storage
✅ **Customer management** - Automatic customer profile creation and updates
✅ **Order tracking** - Complete order lifecycle management
✅ **Sales analytics** - Dedicated sales collection for reporting
✅ **Stripe integration** - Secure payment processing
✅ **RESTful API** - Clean, documented endpoints
✅ **Error handling** - Comprehensive error responses
✅ **Timestamps** - Automatic timestamp management
