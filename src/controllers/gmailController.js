const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_OWNER,
        pass: process.env.EMAIL_PASSWORD 
    }
});

// Verify transporter
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter error:', error);
    } else {
        console.log('✅ Email server ready');
    }
});

exports.sendGmail = async (req, res) => {
    const { gmail } = req.body; 
    if (!gmail) {
        return res.status(400).json({
            success: false,
            message: 'Gmail is required'
        });
    }
    const subject = '🎉 Welcome to Gramathul Spice Hub!';
    const body = `
Dear Subscriber,

Thank you for subscribing to Gramathul Spice Hub! 🌶️

We're excited to have you as part of our community. You'll now receive:
✅ Exclusive offers and discounts
✅ New product launches
✅ Special festival deals
✅ Authentic spice recipes and tips

Stay tuned for amazing updates!

Best regards,
Gramathul Spice Hub Team

---
If you wish to unsubscribe, please contact us at sachintiwari.751858@gmail.com
    `.trim();

    const mailOptions = {
        from: {
            name: 'Gramathul Spice Hub',
            address: 'sachintiwari.751858@gmail.com'
        },
        to: gmail,
        subject: subject,
        text: body,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #d35400;">🎉 Welcome to Gramathul Spice Hub!</h2>
                <p>Dear Subscriber,</p>
                <p>Thank you for subscribing to <strong>Gramathul Spice Hub</strong>! 🌶️</p>
                
                <p>We're excited to have you as part of our community. You'll now receive:</p>
                <ul style="line-height: 1.8;">
                    <li>✅ Exclusive offers and discounts</li>
                    <li>✅ New product launches</li>
                    <li>✅ Special festival deals</li>
                    <li>✅ Authentic spice recipes and tips</li>
                </ul>
                
                <p>Stay tuned for amazing updates!</p>
                
                <p style="margin-top: 30px;">Best regards,<br><strong>Gramathul Spice Hub Team</strong></p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #888;">
                    If you wish to unsubscribe, please contact us at sachintiwari.751858@gmail.com
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${gmail}:`, info.messageId);

        return res.status(200).json({
            success: true,
            message: 'Successfully subscribed! Check your email for confirmation',
            messageId: info.messageId
        });

    } catch (err) {
        console.error(`❌ Failed to send email to ${gmail}:`, err.message);

        if (err.message.includes('Daily user sending limit exceeded')) {
            console.error('🚫 Gmail daily limit reached (500 emails/day)');
            return res.status(429).json({
                success: false,
                message: 'Email service temporarily unavailable. Please try again later.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to send subscription gmail',
            error: err.message
        });
    }
};
