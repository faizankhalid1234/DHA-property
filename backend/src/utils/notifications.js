import Notification from '../models/Notification.js';
import { sendEmail, notificationEmailTemplate } from '../utils/email.js';
import User from '../models/User.js';

export const createNotification = async ({
  recipientId,
  title,
  message,
  type = 'general',
  relatedModel,
  relatedId,
  sendEmailNotification = true,
}) => {
  const notification = await Notification.create({
    recipient: recipientId,
    title,
    message,
    type,
    relatedModel,
    relatedId,
  });

  if (sendEmailNotification) {
    const user = await User.findById(recipientId);
    if (user?.email) {
      const emailResult = await sendEmail({
        to: user.email,
        subject: title,
        html: notificationEmailTemplate(title, message, user.name),
      });
      if (emailResult.success) {
        notification.emailSent = true;
        await notification.save();
      }
    }
  }

  return notification;
};

export const notifyAdmins = async ({ title, message, type, relatedModel, relatedId }) => {
  const admins = await User.find({ role: { $in: ['super_admin', 'admin'] }, isActive: true });
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        recipientId: admin._id,
        title,
        message,
        type,
        relatedModel,
        relatedId,
        sendEmailNotification: false,
      })
    )
  );
};
