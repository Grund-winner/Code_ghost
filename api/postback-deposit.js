// ═══════════════════════════════════════════════════════
// EURO54 - Postback Deposit
// 1Win appelle cette URL quand un utilisateur fait un dépôt
// Route : GET /api/postback-deposit
// ═══════════════════════════════════════════════════════
const { query } = require('../lib/db');
const fetch = require('node-fetch');
const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT) || 8.5;

// === NOTIFICATION TELEGRAM DEPOTS ===
const NOTIF_BOT_TOKEN = process.env.NOTIF_BOT_TOKEN || '';
const ADMIN_CHAT_IDS = (process.env.ADMIN_CHAT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

async function sendNotif(chatId, text) {
    if (!NOTIF_BOT_TOKEN || !chatId) return;
    try {
        await fetch('https://api.telegram.org/bot' + NOTIF_BOT_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
        });
    } catch (e) { console.error('[NOTIF ERROR]', e.message); }
}
// === FIN NOTIFICATION ===

module.exports = async function handler(req, res) {
    try {
        // Assurer que la table deposits existe
        await query(`CREATE TABLE IF NOT EXISTS deposits (
            id SERIAL PRIMARY KEY,
            one_win_user_id TEXT NOT NULL,
            telegram_id BIGINT,
            amount NUMERIC NOT NULL DEFAULT 0,
            transaction_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`);

        const clickid = req.query.clickid || null;
        const userId1win = req.query.user_id;
        const amount = parseFloat(req.query.amount) || 0;
        const transactionId = req.query.transactionid;

        if (!userId1win) return res.status(400).send('Missing user_id');
        console.log(`[POSTBACK DEP] clickid=${clickid}, user_id=${userId1win}, amount=${amount}, txn=${transactionId}`);

        let total = amount;

        if (clickid) {
            // Utilisateur Telegram (sub1 présent)
            const existing = await query('SELECT * FROM users WHERE telegram_id = $1', [clickid]);
            if (existing.length > 0) {
                const user = existing[0];
                total = parseFloat(user.deposit_amount || 0) + amount;
                const ok = total >= MIN_DEPOSIT;
                await query(
                    'UPDATE users SET is_deposited = $1, deposit_amount = $2, one_win_user_id = $3, is_registered = TRUE, deposited_at = CASE WHEN $1 THEN NOW() ELSE deposited_at END, updated_at = NOW() WHERE telegram_id = $4',
                    [ok, total, userId1win, clickid]
                );
                await query(
                    'INSERT INTO deposits (one_win_user_id, telegram_id, amount, transaction_id) VALUES ($1, $2, $3, $4)',
                    [userId1win, clickid, amount, transactionId || null]
                );
            } else {
                const ok = amount >= MIN_DEPOSIT;
                await query(
                    'INSERT INTO users (telegram_id, one_win_user_id, is_registered, is_deposited, deposit_amount, deposited_at, created_at, updated_at) VALUES ($1, $2, TRUE, $3, $4, CASE WHEN $3 THEN NOW() ELSE NULL END, NOW(), NOW())',
                    [clickid, userId1win, ok, amount]
                );
                await query(
                    'INSERT INTO deposits (one_win_user_id, telegram_id, amount, transaction_id) VALUES ($1, $2, $3, $4)',
                    [userId1win, clickid, amount, transactionId || null]
                );
            }
        } else {
            // Utilisateur WhatsApp → on identifie par 1Win user_id
            const existing = await query('SELECT * FROM users WHERE one_win_user_id = $1', [userId1win]);
            if (existing.length > 0) {
                const user = existing[0];
                total = parseFloat(user.deposit_amount || 0) + amount;
                const ok = total >= MIN_DEPOSIT;
                await query(
                    'UPDATE users SET is_deposited = $1, deposit_amount = $2, is_registered = TRUE, deposited_at = CASE WHEN $1 THEN NOW() ELSE deposited_at END, updated_at = NOW() WHERE one_win_user_id = $3',
                    [ok, total, userId1win]
                );
                await query(
                    'INSERT INTO deposits (one_win_user_id, telegram_id, amount, transaction_id) VALUES ($1, $2, $3, $4)',
                    [userId1win, existing[0].telegram_id || null, amount, transactionId || null]
                );
            } else {
                const ok = amount >= MIN_DEPOSIT;
                await query(
                    'INSERT INTO users (one_win_user_id, is_registered, is_deposited, deposit_amount, deposited_at, created_at, updated_at) VALUES ($1, TRUE, $2, $3, CASE WHEN $2 THEN NOW() ELSE NULL END, NOW(), NOW())',
                    [userId1win, ok, amount]
                );
                await query(
                    'INSERT INTO deposits (one_win_user_id, telegram_id, amount, transaction_id) VALUES ($1, NULL, $2, $3)',
                    [userId1win, amount, transactionId || null]
                );
            }
        }

        // Envoi notification aux admins
        if (ADMIN_CHAT_IDS.length > 0 && NOTIF_BOT_TOKEN) {
            const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' });
            const notif = '<b>💰 Nouveau dépôt</b>\n\n'
                + '<b>ID 1Win :</b> <code>' + userId1win + '</code>\n'
                + '<b>Montant :</b> $' + amount.toFixed(2) + '\n'
                + '<b>Total :</b> $' + total.toFixed(2) + '\n'
                + '<b>Date :</b> ' + now;
            for (const chatId of ADMIN_CHAT_IDS) { await sendNotif(chatId, notif); }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[POSTBACK DEP ERROR]', error);
        res.status(500).send('Error');
    }
};
