// utils/emailService.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// ✅ GENERIC FUNCTION - Send any gmail
exports.sendGmail = async (gmail, subject, htmlContent) => {
  try {
    await emailApi.sendTransacEmail({
      subject: subject,
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@gramathulspicehub.com',
        name: process.env.BREVO_SENDER_NAME || 'Gramathul Spice Hub',
      },
      to: [{ email: gmail }],
      htmlContent: htmlContent,
    });
    console.log('✅ Gmail sent to:', gmail);
  } catch (error) {
    console.error('❌ Failed to send gmail:', error);
    throw error;
  }
};

// ✅ Send OTP Gmail for Password Reset
exports.sendOTPGmail = async (gmail, name, otp) => {
  const subject = '🔐 Password Reset OTP - Gramathul Spice Hub';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px;">
      <h2 style="color:#d35400;">🔐 Password Reset Request</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>You requested to reset your password for <strong>Gramathul Spice Hub</strong>.</p>
      
      <div style="background:#f4f4f4; padding:20px; margin:20px 0; border-radius:8px; text-align:center;">
        <p style="font-size:14px; margin:0;">Your OTP is:</p>
        <h1 style="color:#d35400; letter-spacing:8px; margin:10px 0; font-size:36px;">${otp}</h1>
        <p style="font-size:12px; color:#777;">This OTP is valid for 10 minutes</p>
      </div>

      <p>If you didn't request this, please ignore this gmail.</p>
      <p><strong>Gramathul Spice Hub Team</strong></p>
      
      <hr />
      <p style="font-size:12px;color:#777;">
        For security reasons, never share this OTP with anyone.<br/>
        Need help? Contact us at <a href="mailto:deffotechintern24@gmail.com">deffotechintern24@gmail.com</a>
      </p>
    </div>
  `;

  await this.sendGmail(gmail, subject, htmlContent);
  console.log('✅ OTP gmail sent to:', gmail);
};

// ✅ Send Password Changed Confirmation
exports.sendPasswordChangedGmail = async (gmail, name) => {
  const subject = '✅ Password Changed Successfully - Gramathul Spice Hub';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px;">
      <h2 style="color:#27ae60;">✅ Password Changed Successfully!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your password has been changed successfully.</p>
      
      <p>You can now log in with your new password.</p>
      <p>If you didn't make this change, please contact us immediately at <a href="mailto:deffotechintern24@gmail.com" style="color:#d35400;">deffotechintern24@gmail.com</a></p>
      
      <p><strong>Gramathul Spice Hub Team</strong></p>
      
      <hr />
      <p style="font-size:12px;color:#777;">
        This is an automated message. Please do not reply to this gmail.
      </p>
    </div>
  `;

  await this.sendGmail(gmail, subject, htmlContent);
  console.log('✅ Password changed gmail sent to:', gmail);
};

// ✅ Send Welcome/Subscribe Gmail
exports.sendWelcomeGmail = async (gmail) => {
  const subject = '🎉 Welcome to Gramathul Spice Hub!';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px;">
      <h2 style="color:#d35400;">🎉 Welcome to Gramathul Spice Hub!</h2>
      <p>Dear Subscriber,</p>
      <p>Thank you for subscribing to <strong>Gramathul Spice Hub</strong>! 🌶️</p>

      <ul>
        <li>✅ Exclusive offers and discounts</li>
        <li>✅ New product launches</li>
        <li>✅ Festival deals</li>
        <li>✅ Authentic spice recipes</li>
      </ul>

      <p>Stay tuned for amazing updates!</p>
      <p><strong>Gramathul Spice Hub Team</strong></p>

      <hr />
      <p style="font-size:12px;color:#777;">
        If you wish to unsubscribe, contact us at <a href="mailto:deffotechintern24@gmail.com" style="color:#d35400;">deffotechintern24@gmail.com</a>
      </p>
    </div>
  `;

  await this.sendGmail(gmail, subject, htmlContent);
  console.log('✅ Welcome gmail sent to:', gmail);
};

// ✅ Send Order Confirmation Gmail
exports.sendOrderConfirmationGmail = async (gmail, name, orderId, orderDetails) => {
  const subject = `🎉 Order Confirmed #${orderId} - Gramathul Spice Hub`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px;">
      <h2 style="color:#d35400;">🎉 Order Confirmed!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for your order! Your order has been confirmed.</p>
      
      <div style="background:#f4f4f4; padding:15px; margin:20px 0; border-radius:8px;">
        <h3 style="margin:0 0 10px 0;">Order Details</h3>
        <p style="margin:5px 0;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin:5px 0;"><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
        <p style="margin:5px 0;"><strong>Payment Status:</strong> ${orderDetails.paymentStatus}</p>
      </div>

      <p>We'll notify you when your order is shipped.</p>
      <p><strong>Gramathul Spice Hub Team</strong></p>
      
      <hr />
      <p style="font-size:12px;color:#777;">
        Questions? Contact us at <a href="mailto:deffotechintern24@gmail.com">deffotechintern24@gmail.com</a>
      </p>
    </div>
  `;

  await this.sendGmail(gmail, subject, htmlContent);
  console.log('✅ Order confirmation gmail sent to:', gmail);
};
