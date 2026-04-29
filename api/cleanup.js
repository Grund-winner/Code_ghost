const { query } = require('../lib/db');

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

    try {
        const results = {};

        // 1. Supprimer les lignes "Inconnu" avec telegram_id NULL (doublons orphelins)
        const r1 = await query(
            `DELETE FROM users WHERE first_name = 'Inconnu' AND telegram_id IS NULL RETURNING id, one_win_user_id`
        );
        results.inconnu_deleted = r1.length;
        results.inconnu_users = r1;

        // 2. Trouver et supprimer les doublons 1Win (garder la ligne avec telegram_id)
        const dupes = await query(
            `SELECT one_win_user_id FROM users WHERE one_win_user_id IS NOT NULL
             GROUP BY one_win_user_id HAVING COUNT(*) > 1`
        );
        results.dupes_found = dupes.length;
        results.dupes_cleaned = [];

        for (const d of dupes) {
            // Garder la ligne avec telegram_id non-null, supprimer les autres
            const rows = await query(
                `SELECT * FROM users WHERE one_win_user_id = $1 ORDER BY telegram_id NULLS LAST, id DESC`, [d.one_win_user_id]
            );
            // Garder le premier (celui avec telegram_id), supprimer le reste
            const keep = rows[0];
            for (let i = 1; i < rows.length; i++) {
                await query('DELETE FROM users WHERE id = $1', [rows[i].id]);
                results.dupes_cleaned.push({ deleted_id: rows[i].id, one_win_user_id: d.one_win_user_id });
            }
        }

        // 3. Compter les utilisateurs restants
        const remaining = await query('SELECT id, first_name, telegram_id, one_win_user_id, is_registered, is_deposited FROM users ORDER BY id');
        results.remaining_users = remaining;

        res.status(200).json(results);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
