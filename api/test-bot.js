module.exports = async function handler(req, res) {
    const BOT_TOKEN = process.env.BOT_TOKEN || '';
    const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
    
    let result = {};
    
    // Test 1: Check env vars
    result.bot_token = BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'EMPTY';
    result.base_url = BASE_URL || 'EMPTY';
    result.vercel_url = process.env.VERCEL_URL || 'EMPTY';
    
    // Test 2: Try calling Telegram API
    if (req.query.send && BOT_TOKEN) {
        try {
            const chatId = req.query.send;
            const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: '✅ Bot Test - Le bot fonctionne !\n\nTOKEN: ' + (BOT_TOKEN ? 'OK' : 'EMPTY') + '\nBASE_URL: ' + BASE_URL,
                    parse_mode: 'HTML'
                })
            });
            result.telegram = await tgRes.json();
        } catch (e) {
            result.telegram_error = e.message;
        }
    }
    
    res.status(200).json(result);
};
