import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email not configured. Would send to:', to, subject);
    return { success: false, message: 'Email not configured' };
  }
  try {
    await transporter.sendMail({
      from: `"DHA Housing Scheme" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error.message);
    return { success: false, message: error.message };
  }
};

export const notificationEmailTemplate = (title, message, userName) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
    <div style="background: linear-gradient(135deg, #1e3a8a, #172554); padding: 30px; border-radius: 10px 10px 0 0;">
      <h1 style="color: #d4af37; margin: 0;">DHA Housing Scheme</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
      <p>Dear ${userName},</p>
      <h2 style="color: #1e3a8a;">${title}</h2>
      <p>${message}</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated notification from DHA Housing Scheme Management System.</p>
    </div>
  </div>
`;
