// controllers/gmailController.js
const { sendWelcomeGmail } = require('../utils/emailService'); // ✅ Import

exports.sendGmail = async (req, res) => {
  const { gmail } = req.body;

  if (!gmail) {
    return res.status(400).json({
      success: false,
      message: 'Gmail is required',
    });
  }

  try {
    // ✅ Use utility function
    await sendWelcomeGmail(gmail);

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed! Check your gmail.',
    });

  } catch (err) {
    console.error('❌ Subscription Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send subscription gmail',
    });
  }
};
