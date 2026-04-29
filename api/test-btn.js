module.exports = async function handler(req, res) {
    const BOT_TOKEN = process.env.BOT_TOKEN || '';
    const BASE_URL = 'https://code-ghost-deploy.vercel.app';
    
    const btns = [
        [
            { text: "S'inscrire sur 1Win", callback_data: 'register' },
            { text: "Comment ça marche ?", callback_data: 'instructions' }
        ],
        [{ text: "Déjà inscrit(e)", callback_data: 'already_registered' }],
        [{ text: "ACCÉDER AUX PRÉDICTIONS", callback_data: 'predictions' }]
    ];
    
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: 6806173609,
            photo: `${BASE_URL}/images/default.png?v=999`,
            caption: '<b>Bienvenue sur le meilleur bot de prédictions 1win</b>\n\nTest boutons - cliquez sur un bouton:',
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: btns }
        })
    });
    
    const result = await tgRes.json();
    res.status(200).json(result);
};
