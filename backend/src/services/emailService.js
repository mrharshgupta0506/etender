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

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tender Invitation - E-Tender Platform</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background-color: #f8fafc; margin: 0; padding: 0; }
    .email-wrapper { background-color: #f8fafc; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px 20px; }
    .welcome-message { font-size: 18px; font-weight: 500; color: #1f2937; margin-bottom: 20px; }
    .tender-card { background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .tender-title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
    .tender-detail { margin: 8px 0; font-size: 14px; }
    .tender-detail strong { color: #374151; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3); }
    .cta-button:hover { background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); }
    .account-info { background-color: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .account-info h3 { color: #065f46; margin: 0 0 10px 0; font-size: 16px; }
    .account-credential { background-color: #f0fdf4; padding: 10px; border-radius: 6px; margin: 8px 0; font-family: monospace; font-size: 14px; border: 1px solid #bbf7d0; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 0; font-size: 12px; color: #6b7280; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1>🎯 Tender Invitation</h1>
        <p>E-Tender Platform</p>
      </div>
      
      <div class="content">
        <p class="welcome-message">Hello! You've been invited to participate in an exciting tender opportunity.</p>
        
        <div class="tender-card">
          <h2 class="tender-title">${tender.name}</h2>
          <div class="tender-detail">
            <strong>📝 Description:</strong> ${tender.description}
          </div>
          <div class="tender-detail">
            <strong>📅 Start Date:</strong> ${new Date(tender.startDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <div class="tender-detail">
            <strong>⏰ End Date:</strong> ${new Date(tender.endDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${tenderLink}" class="cta-button">View Tender Details & Submit Bid</a>
        </div>

        ${isNewUser ? `
        <div class="account-info">
          <h3>🎉 Welcome to E-Tender Platform!</h3>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          <div class="account-credential">
            <strong>Email:</strong> ${userEmail}
          </div>
          <div class="account-credential">
            <strong>Temporary Password:</strong> ${password}
          </div>
          <p style="font-size: 14px; color: #065f46; margin-top: 10px;">
            <strong>⚠️ Important:</strong> Please change your password after first login for security.
          </p>
        </div>
        ` : `
        <div class="account-info">
          <h3>🔐 Account Access</h3>
          <p>Please use your existing account credentials to log in and access this tender.</p>
        </div>
        `}
      </div>

      <div class="footer">
        <p>This is an automated message from E-Tender Platform. Please do not reply to this email.</p>
        <p>Need help? <a href="${baseUrl}/contact">Contact Support</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  await safeSendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    text,
    html
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

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tender Results - E-Tender Platform</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background-color: #f8fafc; margin: 0; padding: 0; }
    .email-wrapper { background-color: #f8fafc; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px 20px; }
    .announcement { font-size: 18px; font-weight: 500; color: #1f2937; margin-bottom: 20px; text-align: center; }
    .tender-card { background-color: #f3f4f6; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .tender-title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
    .tender-detail { margin: 8px 0; font-size: 14px; }
    .tender-detail strong { color: #374151; }
    .winner-section { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; }
    .winner-badge { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
    .winner-title { font-size: 22px; font-weight: 700; color: #065f46; margin: 10px 0; }
    .winner-amount { font-size: 28px; font-weight: 800; color: #047857; margin: 10px 0; }
    .winner-email { font-size: 16px; color: #059669; font-weight: 500; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3); }
    .cta-button:hover { background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); }
    .congratulations { background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .congratulations p { margin: 0; color: #92400e; font-weight: 500; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 0; font-size: 12px; color: #6b7280; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1>🏆 Tender Results Announced</h1>
        <p>E-Tender Platform</p>
      </div>
      
      <div class="content">
        <p class="announcement">The evaluation process is complete! Here are the final results for this tender.</p>
        
        <div class="tender-card">
          <h2 class="tender-title">${tender.name}</h2>
          <div class="tender-detail">
            <strong>📝 Description:</strong> ${tender.description}
          </div>
        </div>

        <div class="winner-section">
          <div class="winner-badge">Winner Selected</div>
          <h2 class="winner-title">Congratulations!</h2>
          <div class="winner-amount">$${winningBid.bidAmount.toLocaleString()}</div>
          <div class="winner-email">${bidderEmail}</div>
        </div>

        <div style="text-align: center;">
          <a href="${tenderLink}" class="cta-button">View Complete Results</a>
        </div>

        <div class="congratulations">
          <p>🎉 Thank you to all participants for your interest and submissions!</p>
        </div>
      </div>

      <div class="footer">
        <p>This is an automated message from E-Tender Platform. Please do not reply to this email.</p>
        <p>Need help? <a href="${baseUrl}/contact">Contact Support</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const recipients = Array.from(new Set([...(allBidderEmails || []), bidderEmail])).filter(Boolean);

  if (!recipients.length) return;

  await safeSendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to: recipients,
    subject,
    text,
    html
  });
};

const sendForgotPasswordEmail = async ({ to, resetToken }) => {
  const baseUrl = getFrontendBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';

  const text = `You requested a password reset for your E-Tender account.\n\n` +
    `Click the following link to reset your password:\n${resetLink}\n\n` +
    `This link will expire in 1 hour.\n\n` +
    `If you did not request this, please ignore this email.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - E-Tender Platform</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background-color: #f8fafc; margin: 0; padding: 0; }
    .email-wrapper { background-color: #f8fafc; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px 20px; }
    .message { font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.7; }
    .security-notice { background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .security-notice h3 { color: #dc2626; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center; }
    .security-notice p { margin: 0; color: #7f1d1d; font-size: 14px; }
    .reset-section { background-color: #f3f4f6; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; }
    .reset-icon { font-size: 48px; margin-bottom: 15px; }
    .reset-title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
    .reset-description { color: #6b7280; margin-bottom: 20px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3); }
    .cta-button:hover { background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); }
    .expiry-notice { background-color: #fffbeb; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .expiry-notice p { margin: 0; color: #92400e; font-weight: 500; font-size: 14px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 0; font-size: 12px; color: #6b7280; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1>🔐 Password Reset</h1>
        <p>E-Tender Platform</p>
      </div>
      
      <div class="content">
        <p class="message">We received a request to reset your password for your E-Tender account. No worries, we've got you covered!</p>
        
        <div class="reset-section">
          <div class="reset-icon">🔑</div>
          <h2 class="reset-title">Reset Your Password</h2>
          <p class="reset-description">Click the button below to securely reset your password. You'll be redirected to a secure page where you can create a new password.</p>
          <a href="${resetLink}" class="cta-button">Reset My Password</a>
        </div>

        <div class="expiry-notice">
          <p>⏰ <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.</p>
        </div>

        <div class="security-notice">
          <h3>🛡️ Security Notice</h3>
          <p>If you didn't request this password reset, please ignore this email. Your account remains secure, and no changes have been made.</p>
        </div>
      </div>

      <div class="footer">
        <p>This is an automated message from E-Tender Platform. Please do not reply to this email.</p>
        <p>Need help? <a href="${baseUrl}/contact">Contact Support</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  await safeSendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    text,
    html
  });
};

module.exports = {
  sendInvitationEmail,
  sendWinnerEmail,
  sendForgotPasswordEmail
};


