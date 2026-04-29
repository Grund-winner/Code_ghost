module.exports = async (req, res) => {
    try {
        const token = process.env.BOT_TOKEN;
        const imgUrl = process.env.BASE_URL + '/images/default.png';
        
        // Test sendPhoto
        const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: req.query.chat_id || '1709273212',
                photo: imgUrl,
                caption: '<b>Test sendPhoto</b> - Image test',
                parse_mode: 'HTML'
            })
        });
        const data = await r.json();
        
        if (data.ok) {
            res.json({ success: true, message_id: data.result?.message_id });
        } else {
            res.status(500).json({ 
                success: false, 
                error: data.description,
                error_code: data.error_code
            });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
