const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

exports.sendGmail = async (req, res) => {
  const { gmail } = req.body;

  if (!gmail) {
    return res.status(400).json({
      success: false,
      message: 'Gmail is required',
    });
  }

  try {
    const response = await emailApi.sendTransacEmail({
      subject: '🎉 Welcome to Gramathul Spice Hub!',
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME,
      },
      to: [{ email: gmail }],
      htmlContent: `
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
            If you wish to unsubscribe, contact us at sachintiwari.751858@gmail.com
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed! Check your email.',
      messageId: response.messageId,
    });

  } catch (err) {
    console.error('❌ Brevo Email Error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to send subscription email',
    });
  }
};
