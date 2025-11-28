//backend/controller/paymentcontroller.js

const kelpayService = require('../services/kelpayService');
const checkPaymentStatus = require('../utils/checkPaymentStatus');
const fetch = require('node-fetch');
const base64 = require('base-64');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

const PAYPAL_API = 'https://api-m.paypal.com'; // Live endpoint

// In-memory storage for demo (replace with database in production)
const payments = new Map();

class PaymentController {
  async processMobilePayment(req, res) {
    try {
      const { mobileNumber, amount, currency, description, movieId } = req.body;

      // Validate required fields
      if (!mobileNumber || !amount || !currency || !movieId) {
        return res.status(400).json({
          error: 'Missing required fields: mobileNumber, amount, currency, movieId'
        });
      }

      // Validate mobile number format
      if (!kelpayService.validateMobileNumber(mobileNumber)) {
        return res.status(400).json({
          error: 'Invalid mobile number format. Use DRC format (e.g., 243123456789 or 0123456789)'
        });
      }

      const formattedNumber = kelpayService.formatMobileNumber(mobileNumber);
      const operator = kelpayService.getMobileOperator(mobileNumber);
      const reference = `PMStreaming_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      console.log('Processing payment:', {
        mobileNumber: kelpayService.maskMobileNumber(formattedNumber),
        amount,
        currency,
        operator,
        reference
      });

      // Call KELPAY API
      const kelpayResponse = await kelpayService.requestPayment({
        mobileNumber: formattedNumber,
        amount: parseFloat(amount),
        currency,
        description: description || `Payment for movie ${movieId}`,
        reference
      });

      // Store payment info in memory (use database in production)
      payments.set(kelpayResponse.transactionid, {
        transactionId: kelpayResponse.transactionid,
        reference,
        movieId,
        amount: parseFloat(amount),
        currency,
        mobileNumber: formattedNumber,
        operator,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      console.log('KELPAY response:', kelpayResponse);

      res.json({
        success: true,
        code: kelpayResponse.code,
        description: kelpayResponse.description,
        reference: kelpayResponse.reference,
        transactionId: kelpayResponse.transactionid,
        operator
      });

    } catch (error) {
      console.error('Payment processing error:', error.message);
      res.status(500).json({
        error: error.message || 'Payment processing failed'
      });
    }
  }

  async handleCallback(req, res) {
    try {
      const { code, description, reference, transactionid } = req.body;

      console.log('KELPAY callback received:', {
        code,
        description,
        reference,
        transactionid
      });

      // Update payment status in memory (use database in production)
      const payment = payments.get(transactionid);
      if (payment) {
        payment.status = code === "0" ? 'success' : 'failed';
        payment.description = description;
        payment.updatedAt = new Date().toISOString();
        
        console.log('Payment status updated:', {
          transactionId: transactionid,
          status: payment.status
        });
      } else {
        console.warn('Payment not found for transaction:', transactionid);
      }

      // Always respond with 200 OK to KELPAY
      res.status(200).send('OK');

    } catch (error) {
      console.error('Callback processing error:', error.message);
      // Still respond with 200 to avoid KELPAY retries
      res.status(200).send('ERROR');
    }
  }

  async checkPaymentStatus(req, res) {
    try {
      const { transactionId } = req.params;

      // Get payment from memory (use database in production)
      const payment = payments.get(transactionId);

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json({
        transactionId: payment.transactionId,
        reference: payment.reference,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        operator: payment.operator,
        description: payment.description,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      });

    } catch (error) {
      console.error('Status check error:', error.message);
      res.status(500).json({ error: 'Failed to check payment status' });
    }
  }

// Create PayPal Order
async createPaypalOrder(req, res) {
  try {
    const { amount, description } = req.body;

    const auth = base64.encode(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: amount.toFixed(2) },
          description
        }],
      }),
    });

    const orderData = await orderRes.json();
    res.json(orderData);
  } catch (error) {
    console.error('Create PayPal Order Error:', error.message);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
}

// Capture PayPal Payment
async capturePaypalOrder(req, res) {
  try {
    const { orderID } = req.params;

    const auth = base64.encode(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const captureData = await captureRes.json();
    res.json(captureData);
  } catch (error) {
    console.error('Capture PayPal Order Error:', error.message);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
}
}
module.exports = new PaymentController();