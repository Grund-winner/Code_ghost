module.exports = async (req, res) => {
    const token = process.env.BOT_TOKEN || 'NOT SET';
    const baseUrl = process.env.BASE_URL || 'NOT SET';
    const vercelUrl = process.env.VERCEL_URL || 'NOT SET';
    
    // Only expose partial token for security
    const maskedToken = token.substring(0, 10) + '...' + token.substring(token.length - 5);
    
    res.json({
        bot_token_masked: maskedToken,
        bot_token_length: token.length,
        base_url: baseUrl,
        vercel_url: vercelUrl,
        webhook_url: `https://api.telegram.org/bot${token.substring(0,10)}.../getWebhookInfo`
    });
};
