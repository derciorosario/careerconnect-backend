'use strict';

const PLATFORM_API = process.env.PLATFORM_API;

const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove all non-numeric characters
  let cleaned = String(phone).replace(/\D/g, '');

  if (!cleaned) return null;

  // Add country code if not present (default to Mozambique +258)
  if (!cleaned.startsWith('258')) {
    // If it starts with 0, remove it and add 258
    if (cleaned.startsWith('0')) {
      cleaned = '258' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      // It's a local Mozambique number
      cleaned = '258' + cleaned;
    } else {
      // Just add 258
      cleaned = '258' + cleaned;
    }
  }

  return cleaned;
};

const sendWhatsAppMessage = async (to, message) => {
  try {
    const formattedPhone = formatPhoneNumber(to);

    if (!formattedPhone) {
      return { success: false, error: 'Invalid phone number' };
    }

    if (!PLATFORM_API) {
      console.warn('WhatsApp API Error: PLATFORM_API is not configured');
      return { success: false, error: 'Platform API not configured' };
    }

    const resp = await fetch(PLATFORM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: formattedPhone, message }),
    });
    const text = await resp.text();
    if (!resp.ok) {
      console.log(text);
      return {
        success: false,
        error: 'Platform API failed',
      };
    }

    return {
      success: true,
      messageId: null,
      data: text,
    };
  } catch (error) {
    console.error('WhatsApp API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

// Send the same notification via WhatsApp when the target has a phone number.
// Failures are logged but never block the primary email flow.
const notifyWhatsApp = async (phone, message) => {
  if (!phone) return;
  const result = await sendWhatsAppMessage(phone, message);
  if (!result.success) {
    console.warn('WhatsApp notification skipped:', result.error);
  }
  return result;
};

module.exports = { formatPhoneNumber, sendWhatsAppMessage, notifyWhatsApp };