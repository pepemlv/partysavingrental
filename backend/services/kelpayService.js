const axios = require('axios');

class KelpayService {
  constructor() {
    this.apiUrl = process.env.KELPAY_API_URL || 'https://pay.keccel.com/kelpay/v1';
    this.merchantCode = process.env.KELPAY_MERCHANT_CODE;
    this.token = process.env.KELPAY_TOKEN;
    this.callbackUrl = process.env.KELPAY_CALLBACK_URL;
    
    if (!this.merchantCode || !this.token) {
      console.warn('⚠️  KELPAY credentials not configured - using mock mode');
    }
  }

  async requestPayment({ mobileNumber, amount, currency, description, reference }) {
    try {
      console.log('Requesting KELPAY payment:', {
        reference,
        amount,
        currency,
        mobileNumber: this.maskMobileNumber(mobileNumber)
      });

      // If credentials are not configured, use mock response
      if (!this.merchantCode || !this.token) {
        console.log('Using mock KELPAY response');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
        
        return {
          code: "0",
          description: "Payment request received (MOCK)",
          reference: reference,
          transactionid: `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        };
      }

      const requestData = {
        merchantcode: this.merchantCode,
        mobilenumber: mobileNumber,
        reference: reference,
        amount: amount.toString(),
        currency: currency,
        description: description,
        callbackurl: this.callbackUrl
      };

      const response = await axios.post(
        `${this.apiUrl}/payment.asp`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      console.log('KELPAY payment response received:', {
        reference,
        code: response.data.code,
        transactionId: response.data.transactionid
      });

      return response.data;

    } catch (error) {
      console.error('KELPAY payment request failed:', {
        reference,
        error: error.message,
        response: error.response?.data
      });

      if (error.response) {
        throw new Error(`KELPAY API Error: ${error.response.data.description || error.message}`);
      } else if (error.request) {
        throw new Error('KELPAY API is not responding. Please try again later.');
      } else {
        throw new Error(`Payment request failed: ${error.message}`);
      }
    }
  }

  validateMobileNumber(mobileNumber) {
    // Remove any spaces or special characters
    const cleanNumber = mobileNumber.replace(/[\s\-\(\)]/g, '');
    
    // DRC mobile numbers should start with 243 and be 12 digits total
    // Or start with 0 and be 10 digits (we'll convert to international format)
    const drcPattern = /^(243[0-9]{9}|0[0-9]{9})$/;
    
    return drcPattern.test(cleanNumber);
  }

  formatMobileNumber(mobileNumber) {
    const cleanNumber = mobileNumber.replace(/[\s\-\(\)]/g, '');
    
    // If starts with 0, replace with 243
    if (cleanNumber.startsWith('0')) {
      return '243' + cleanNumber.substring(1);
    }
    
    return cleanNumber;
  }

  getMobileOperator(mobileNumber) {
    const cleanNumber = this.formatMobileNumber(mobileNumber);
    
    // DRC operator prefixes (after 243)
    const prefix = cleanNumber.substring(3, 6);
    
    const operators = {
      '810': 'Airtel Money', '811': 'Airtel Money', '812': 'Airtel Money',
      '813': 'Airtel Money', '814': 'Airtel Money', '815': 'Airtel Money',
      '816': 'Airtel Money', '817': 'Airtel Money', '818': 'Airtel Money', '819': 'Airtel Money',
      
      '820': 'Orange Money', '821': 'Orange Money', '822': 'Orange Money',
      '823': 'Orange Money', '824': 'Orange Money', '825': 'Orange Money',
      '826': 'Orange Money', '827': 'Orange Money', '828': 'Orange Money', '829': 'Orange Money',
      
      '970': 'M-PESA', '971': 'M-PESA', '972': 'M-PESA',
      '973': 'M-PESA', '974': 'M-PESA', '975': 'M-PESA',
      '976': 'M-PESA', '977': 'M-PESA', '978': 'M-PESA', '979': 'M-PESA',
      
      '900': 'AfriMoney', '901': 'AfriMoney', '902': 'AfriMoney',
      '903': 'AfriMoney', '904': 'AfriMoney', '905': 'AfriMoney',
      '906': 'AfriMoney', '907': 'AfriMoney', '908': 'AfriMoney', '909': 'AfriMoney'
    };
    
    return operators[prefix] || 'Unknown Operator';
  }

  maskMobileNumber(mobileNumber) {
    if (!mobileNumber || mobileNumber.length < 8) return mobileNumber;
    const start = mobileNumber.substring(0, 3);
    const end = mobileNumber.substring(mobileNumber.length - 3);
    return `${start}****${end}`;
  }
}

module.exports = new KelpayService();