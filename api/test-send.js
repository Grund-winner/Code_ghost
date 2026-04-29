module.exports = async (req, res) => {
    try {
        const token = process.env.BOT_TOKEN;
        const baseUrl = process.env.BASE_URL;
        const imgUrl = baseUrl + '/images/default.png';
        
        // Test 1: Verify image is accessible
        const imgRes = await fetch(imgUrl, { method: 'HEAD' });
        
        // Test 2: Try sendPhoto to a known chat
        const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: 1709273212,
                photo: imgUrl,
                caption: '<b>Test image</b>',
                parse_mode: 'HTML'
            })
        });
        const sendData = await sendRes.json();
        
        res.json({
            image_url: imgUrl,
            image_status: imgRes.status,
            image_content_type: imgRes.headers.get('content-type'),
            send_photo_ok: sendData.ok,
            send_photo_error: sendData.description || null,
            send_photo_error_code: sendData.error_code || null
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
