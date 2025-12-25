const nodemailer = require('nodemailer');

// ✅ FIXED: Explicit configuration with proper timeouts and SSL
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Use SSL port (more reliable than 587)
    secure: true, // true for port 465
    auth: {
        user: process.env.EMAIL_OWNER,
        pass: process.env.EMAIL_PASSWORD // MUST be App Password from Google
    },
    tls: {
        rejectUnauthorized: false, // Important for some hosting providers
        minVersion: 'TLSv1.2'
    },
    // ✅ Connection pooling for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // ✅ Timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // ✅ Debug in development
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
});

// ✅ Verify connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter error:', error.message);
        console.error('   Make sure you are using Gmail App Password, not regular password!');
    } else {
        console.log('✅ Email server ready to send messages');
    }
});

// ✅ Main email sending function with retry and non-blocking
exports.sendGmail = async (req, res) => {
    const { gmail } = req.body;

    // Validate email presence
    if (!gmail) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(gmail)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    // Email content
    const subject = '🎉 Welcome to Gramathul Spice Hub!';
    const textBody = `
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
If you wish to unsubscribe, please contact us at ${process.env.EMAIL_OWNER}
    `.trim();

    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #d35400; margin: 0;">🎉 Welcome to Gramathul Spice Hub!</h2>
            </div>
            
            <p style="color: #333; font-size: 16px;">Dear Subscriber,</p>
            
            <p style="color: #333; font-size: 16px;">
                Thank you for subscribing to <strong>Gramathul Spice Hub</strong>! 🌶️
            </p>
            
            <p style="color: #333; font-size: 16px;">
                We're excited to have you as part of our community. You'll now receive:
            </p>
            
            <ul style="line-height: 1.8; color: #333; font-size: 15px;">
                <li>✅ Exclusive offers and discounts</li>
                <li>✅ New product launches</li>
                <li>✅ Special festival deals</li>
                <li>✅ Authentic spice recipes and tips</li>
            </ul>
            
            <p style="color: #333; font-size: 16px;">Stay tuned for amazing updates!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #d35400;">
                <p style="color: #333; font-size: 16px; margin: 0;">
                    Best regards,<br>
                    <strong>Gramathul Spice Hub Team</strong>
                </p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="font-size: 12px; color: #888; text-align: center;">
                If you wish to unsubscribe, please contact us at 
                <a href="mailto:${process.env.EMAIL_OWNER}" style="color: #d35400;">${process.env.EMAIL_OWNER}</a>
            </p>
        </div>
    `;

    const mailOptions = {
        from: {
            name: 'Gramathul Spice Hub',
            address: process.env.EMAIL_OWNER
        },
        to: gmail,
        subject: subject,
        text: textBody,
        html: htmlBody
    };

    // ✅ STRATEGY 1: Non-blocking (Recommended for production)
    // Send response immediately, email in background
    try {
        // Respond to user immediately
        res.status(200).json({
            success: true,
            message: 'Successfully subscribed! Confirmation email will arrive shortly.'
        });

        // Send email asynchronously with retry
        sendEmailWithRetry(mailOptions, gmail, 3);

    } catch (err) {
        console.error(`❌ Unexpected error:`, err);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during subscription'
        });
    }
};

// ✅ Helper function: Send email with retry logic
async function sendEmailWithRetry(mailOptions, recipientEmail, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📧 [Attempt ${attempt}/${maxRetries}] Sending email to ${recipientEmail}...`);

            // Add timeout protection
            const info = await Promise.race([
                transporter.sendMail(mailOptions),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Email timeout after 15 seconds')), 15000)
                )
            ]);

            console.log(`✅ Email successfully sent to ${recipientEmail}`);
            console.log(`   Message ID: ${info.messageId}`);
            return info; // Success!

        } catch (err) {
            console.error(`❌ [Attempt ${attempt}/${maxRetries}] Failed to send email to ${recipientEmail}`);
            console.error(`   Error: ${err.message}`);

            // Don't retry on specific errors
            if (err.message.includes('Daily user sending limit exceeded')) {
                console.error('🚫 Gmail daily sending limit reached (500 emails/day)');
                break; // Stop retrying
            }

            if (err.code === 'EAUTH') {
                console.error('🔐 Authentication failed - Check your App Password!');
                break; // Stop retrying
            }

            if (err.message.includes('Invalid login')) {
                console.error('🔐 Invalid credentials - Use Gmail App Password, not regular password!');
                break; // Stop retrying
            }

            // Retry with exponential backoff
            if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`⏳ Waiting ${waitTime / 1000} seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.error(`❌ All ${maxRetries} attempts failed for ${recipientEmail}`);
                // Optionally: Send to error tracking service (Sentry, etc.)
            }
        }
    }
}