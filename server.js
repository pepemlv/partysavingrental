import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// CORS configuration for production
const configuredFrontendOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://partysavingrental.com', 
        'https://www.partysavingrental.com',
        'https://partysavingsrentals.com',
        'https://www.partysavingsrentals.com',
        'https://partysavingrental.vercel.app',
        /\.vercel\.app$/,  // Allow all Vercel preview deployments
        ...configuredFrontendOrigins,
      ]
    : '*',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Party Saver Rentals API is running',
    health: '/api/health',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Payment server is running' });
});

// Create payment intent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, customerName, customerEmail, customerPhone } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      metadata: {
        customerName,
        customerEmail,
        customerPhone,
      },
      description: `Party Rental Equipment - ${customerName}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const buildOrderAlertHtml = (order) => {
  const pricing = order.pricing || {};
  const address = order.address || {};
  const cartRows = (order.cart || [])
    .map((item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.productName || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity || 0}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.addonSelected && item.addonName ? item.addonName : '-'}</td>
      </tr>
    `)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="color:#166534;">New Paid Order</h2>
      <p><strong>Customer:</strong> ${order.customerName || '-'}</p>
      <p><strong>Phone:</strong> ${order.customerPhone || '-'}</p>
      <p><strong>Email:</strong> ${order.customerEmail || '-'}</p>
      <p><strong>City:</strong> ${order.selectedCity || '-'}</p>
      <p><strong>Event Date:</strong> ${order.eventDate || '-'}</p>
      <p><strong>Rental Days:</strong> ${order.rentalDays || 1}</p>
      <p><strong>Delivery Method:</strong> ${order.deliveryMethod || '-'}</p>
      <p><strong>Address:</strong> ${address.fullAddress || address.street || '-'}</p>
      <p><strong>Distance:</strong> ${order.distance ? `${Number(order.distance).toFixed(2)} miles` : '-'}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px;text-align:left;">Item</th>
            <th style="padding:8px;text-align:center;">Qty</th>
            <th style="padding:8px;text-align:left;">Addon</th>
          </tr>
        </thead>
        <tbody>${cartRows}</tbody>
      </table>
      <p style="font-size:18px;margin-top:16px;"><strong>Total:</strong> $${Number(pricing.total || 0).toFixed(2)}</p>
      <p><strong>Payment ID:</strong> ${order.paymentIntentId || '-'}</p>
    </div>
  `;
};

const sendEmailWithSmtp = async ({ fromEmail, recipients, subject, html }) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return { sent: false, reason: 'SMTP is not configured' };
  }

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: fromEmail || smtpUser,
    to: recipients,
    subject,
    html,
  });

  return { sent: true, provider: 'smtp' };
};

const sendEmailWithResend = async ({ fromEmail, recipients, subject, html }) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return { sent: false, reason: 'RESEND_API_KEY is not configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: recipients,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Resend email failed');
  }

  return { sent: true, provider: 'resend' };
};

app.post('/api/send-order-alert', async (req, res) => {
  try {
    const { order, adminEmails = [] } = req.body;
    const fromEmail = process.env.ORDER_ALERT_FROM_EMAIL || process.env.SMTP_USER || 'Party Saver Rentals <orders@partysavingrental.com>';
    const superAdminEmails = (process.env.SUPER_ADMIN_ALERT_EMAILS || '')
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
    const recipients = [...new Set([...superAdminEmails, ...adminEmails].filter(Boolean))];

    if (!order) {
      return res.status(400).json({ error: 'Order is required' });
    }

    console.log('Order alert request received:', {
      selectedCity: order.selectedCity || '',
      paymentIntentId: order.paymentIntentId || '',
      superAdminCount: superAdminEmails.length,
      cityAdminCount: adminEmails.length,
      recipientCount: recipients.length,
      smtpHost: process.env.SMTP_HOST || '',
      smtpUser: process.env.SMTP_USER || '',
      fromEmail,
    });

    if (recipients.length === 0) {
      console.warn('Order alert skipped: no recipient emails configured');
      return res.json({ success: false, skipped: true, reason: 'No recipient emails configured' });
    }

    const subject = `New paid order - ${order.selectedCity || 'Party Saver Rentals'} - $${Number(order.pricing?.total || 0).toFixed(2)}`;
    const html = buildOrderAlertHtml(order);
    const smtpResult = await sendEmailWithSmtp({ fromEmail, recipients, subject, html });

    if (!smtpResult.sent) {
      console.warn('SMTP order alert not sent:', smtpResult.reason);
      const resendResult = await sendEmailWithResend({ fromEmail, recipients, subject, html });
      if (!resendResult.sent) {
        console.warn('Order alert skipped:', smtpResult.reason, resendResult.reason);
        return res.json({
          success: false,
          skipped: true,
          reason: `${smtpResult.reason}; ${resendResult.reason}`,
        });
      }

      console.log('Order alert email sent with Resend:', { recipients });
      return res.json({ success: true, provider: resendResult.provider, recipients });
    }

    console.log('Order alert email sent with SMTP:', { recipients });
    res.json({ success: true, provider: smtpResult.provider, recipients });
  } catch (error) {
    console.error('Error sending order alert:', error);
    res.status(500).json({
      error: 'Failed to send order alert',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Webhook endpoint for Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).send('Webhook signature or secret missing');
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful!', paymentIntent.id);
        // You can add logic here to update your database
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
});

app.listen(port, () => {
  console.log(`Payment server running on port ${port}`);
  console.log(`Stripe API Version: 2024-11-20.acacia`);
});

// Export for serverless deployment (Vercel)
export default app;
