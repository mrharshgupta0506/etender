const createTransporter = require('../config/email');

const transporter = createTransporter();

// Verify transporter if it exists
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP transporter verification failed:', error);
    } else {
      console.log('SMTP transporter is ready to send emails');
    }
  });
}

const getFrontendBaseUrl = () => process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

const safeSendMail = async (options) => {
  if (!transporter) {
    console.log('Email not sent (no transporter configured):', options.subject);
    return;
  }
  try {
    await transporter.sendMail(options);
    console.log('Email sent successfully:', options.subject);
  } catch (error) {
    console.error('Failed to send email:', options.subject, error.message);
    throw error; // Re-throw to let caller handle
  }
};

const sendInvitationEmail = async ({ to, tender, isNewUser, password, userEmail }) => {
  const baseUrl = getFrontendBaseUrl();
  const tenderLink = `${baseUrl}/tenders/${tender._id}`;
  const subject = `Invitation to tender: ${tender.name}`;

  let text = `You have been invited to participate in the tender "${tender.name}".\n\n`;
  text += `Description: ${tender.description}\n`;
  text += `Start Date: ${new Date(tender.startDate).toLocaleString()}\n`;
  text += `End Date: ${new Date(tender.endDate).toLocaleString()}\n\n`;
  text += `Access the tender here: ${tenderLink}\n\n`;

  if (isNewUser) {
    text += 'Your account has been created for the E-Tender platform.\n';
    text += `Login email: ${userEmail}\n`;
    text += `Temporary password: ${password}\n`;
  } else {
    text += 'Use your existing account credentials to log in.\n';
  }

  await safeSendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    text
  });
};

const sendWinnerEmail = async ({ tender, winningBid, bidderEmail, allBidderEmails }) => {
  const baseUrl = getFrontendBaseUrl();
  const tenderLink = `${baseUrl}/tenders/${tender._id}`;
  const subject = `Winner selected for tender: ${tender.name}`;

  const text = `The tender "${tender.name}" has been awarded.\n\n` +
    `Winning bidder: ${bidderEmail}\n` +
    `Winning bid amount: ${winningBid.bidAmount}\n\n` +
    `You can view the tender details and results here: ${tenderLink}\n`;

  const recipients = Array.from(new Set([...(allBidderEmails || []), bidderEmail])).filter(Boolean);

  if (!recipients.length) return;

  await safeSendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to: recipients,
    subject,
    text
  });
};

module.exports = {
  sendInvitationEmail,
  sendWinnerEmail
};


