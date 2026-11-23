const nodemailer = require('nodemailer');
const env = require('../../config/env');

const createEmailService = ({ transporter } = {}) => {
  let emailTransporter = transporter;

  const getTransporter = () => {
    if (emailTransporter) return emailTransporter;
    if (!env.smtpHost) throw new Error('SMTP_HOST is not configured');
    emailTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
    });
    return emailTransporter;
  };

  const send = async ({ to, subject, text }) => {
    if (!to) throw new Error('Email recipient is required');
    return getTransporter().sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text,
    });
  };

  return { send };
};

module.exports = { ...createEmailService(), createEmailService };
