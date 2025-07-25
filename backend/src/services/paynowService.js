// PayNow Service for handling PayNow API integration
// This is a mock implementation - in production, you would integrate with actual PayNow API

class PayNowService {
  constructor() {
    // In production, these would be environment variables
    this.apiKey = process.env.PAYNOW_API_KEY || 'mock_api_key';
    this.merchantId = process.env.PAYNOW_MERCHANT_ID || 'mock_merchant_id';
    this.baseUrl = process.env.PAYNOW_BASE_URL || 'https://api.paynow.com.sg';
  }

  // Generate PayNow reference number
  generateReference() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PN${timestamp}${random}`;
  }

  // Process PayNow transfer
  async processTransfer(amount, recipientPhone, reference) {
    try {
      // In production, this would be an actual API call to PayNow
      // For now, we'll simulate the API call
      
      const transferData = {
        amount: amount,
        recipientPhone: recipientPhone,
        reference: reference,
        currency: 'SGD',
        description: 'Coach withdrawal',
        timestamp: new Date().toISOString()
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate successful transfer
      const response = {
        success: true,
        reference: reference,
        status: 'pending',
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        transferId: `TXN${Date.now()}`,
        message: 'Transfer request submitted successfully'
      };

      return response;
    } catch (error) {
      console.error('PayNow transfer error:', error);
      throw new Error('Failed to process PayNow transfer');
    }
  }

  // Check transfer status
  async checkTransferStatus(reference) {
    try {
      // In production, this would query PayNow API for status
      // For now, we'll simulate status check
      
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate status response
      const statuses = ['pending', 'processing', 'completed', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        reference: reference,
        status: randomStatus,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('PayNow status check error:', error);
      throw new Error('Failed to check transfer status');
    }
  }

  // Validate phone number format for PayNow
  validatePhoneNumber(phoneNumber) {
    // Singapore phone number validation
    const sgPhoneRegex = /^(\+65|65)?[689]\d{7}$/;
    return sgPhoneRegex.test(phoneNumber);
  }

  // Format phone number for PayNow
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it starts with 65, replace with +65
    if (cleaned.startsWith('65')) {
      cleaned = '+' + cleaned;
    }
    
    // If it doesn't start with +, add +65
    if (!cleaned.startsWith('+')) {
      cleaned = '+65' + cleaned;
    }
    
    return cleaned;
  }

  // Get transfer history
  async getTransferHistory(phoneNumber, limit = 10, offset = 0) {
    try {
      // In production, this would query PayNow API for transfer history
      // For now, we'll return mock data
      
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockTransfers = [
        {
          id: '1',
          reference: 'PN123456789',
          amount: 200,
          status: 'completed',
          recipientPhone: phoneNumber,
          createdAt: '2025-06-15T14:30:00Z',
          completedAt: '2025-06-16T10:15:00Z'
        },
        {
          id: '2',
          reference: 'PN987654321',
          amount: 150,
          status: 'pending',
          recipientPhone: phoneNumber,
          createdAt: '2025-06-18T09:00:00Z'
        }
      ];

      return {
        transfers: mockTransfers.slice(offset, offset + limit),
        total: mockTransfers.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('PayNow history error:', error);
      throw new Error('Failed to get transfer history');
    }
  }
}

module.exports = new PayNowService(); 