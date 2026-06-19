import QRCode from 'qrcode';

export const generatePropertyQR = async (propertyData) => {
  const payload = JSON.stringify({
    propertyId: propertyData.propertyId,
    propertyNumber: propertyData.propertyNumber,
    block: propertyData.blockName,
  });
  return QRCode.toDataURL(payload, { width: 300, margin: 2 });
};
