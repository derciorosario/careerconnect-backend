'use strict';
const QRCode = require('qrcode');

const generateQR = async (text) => {
  return QRCode.toDataURL(text);
};

const generateQRString = async (text) => {
  return QRCode.toString(text, { type: 'terminal' });
};

module.exports = { generateQR, generateQRString };
