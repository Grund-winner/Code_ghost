const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    try {
        const body = req.body;
        const winId = body.winId || '123456789';
        const telegramId = body.telegramId || '2120696159';
        const username = body.username || 'test';
        const firstName = body.firstName || 'Test';
        const results = {};

        // Step 1: Find by 1Win
        const found = await query('SELECT * FROM users WHERE one_win_user_id = $1', [winId]);
        results.step1_found = found.length > 0 ? { id: found[0].id, first_name: found[0].first_name, telegram_id: found[0].telegram_id } : 'NOT FOUND';

        if (found.length === 0) {
            return res.status(200).json({ error: 'ID 1Win non trouve', ...results });
        }

        const targetUser = found[0];
        results.step2_targetUser = { id: targetUser.id, telegram_id: targetUser.telegram_id };

        // Step 3: Find by telegram
        const telegramUser = await query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
        results.step3_telegramUser = telegramUser.length > 0 ? { id: telegramUser[0].id, telegram_id: telegramUser[0].telegram_id } : 'NOT FOUND';

        if (telegramUser.length > 0 && String(telegramUser[0].id) !== String(targetUser.id)) {
            results.step4_merge_needed = true;
            results.step4a_updating = 'id=' + targetUser.id + ' SET telegram_id=' + telegramId;
            const r1 = await query(
                `UPDATE users SET telegram_id = $1, username = COALESCE($2, username), first_name = COALESCE($3, first_name), last_name = COALESCE($4, last_name),
                 is_registered = TRUE, updated_at = NOW() WHERE id = $5`,
                [telegramId, username, firstName, null, targetUser.id]
            );
            results.step4a_update_result = 'OK rows=' + (r1.rowCount || r1.length || '?');

            results.step4b_deleting = 'id=' + telegramUser[0].id;
            const r2 = await query('DELETE FROM users WHERE id = $1', [telegramUser[0].id]);
            results.step4b_delete_result = 'OK rows=' + (r2.rowCount || r2.length || '?');
        } else {
            results.step4_merge_needed = false;
            results.step4_updating = 'id=' + targetUser.id + ' SET telegram_id=' + telegramId;
            const r1 = await query(
                `UPDATE users SET telegram_id = $1, username = COALESCE($2, username), first_name = COALESCE($3, first_name), last_name = COALESCE($4, last_name),
                 is_registered = TRUE, updated_at = NOW() WHERE id = $5`,
                [telegramId, username, firstName, null, targetUser.id]
            );
            results.step4_update_result = 'OK';
        }

        // Step 5: Verify
        const afterTg = await query('SELECT id, first_name, telegram_id, one_win_user_id FROM users WHERE telegram_id = $1', [telegramId]);
        const afterWin = await query('SELECT id, first_name, telegram_id, one_win_user_id FROM users WHERE one_win_user_id = $1', [winId]);
        results.step5_after_telegram = afterTg;
        results.step5_after_1win = afterWin;

        const allUsers = await query('SELECT id, first_name, telegram_id, one_win_user_id FROM users ORDER BY id');
        results.all_users = allUsers;

        res.status(200).json(results);
    } catch(e) {
        res.status(500).json({ error: e.message, stack: e.stack });
    }
};
