const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// PayPal
router.post('/paypal/orders', paymentController.createPaypalOrder);
router.post('/paypal/orders/:orderID/capture', paymentController.capturePaypalOrder);

// Mobile
router.post('/mobile/pay', paymentController.processMobilePayment);
router.post('/mobile/callback', paymentController.handleCallback);
router.get('/mobile/status/:transactionId', paymentController.checkPaymentStatus);

module.exports = router;
