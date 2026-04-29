const { query } = require('../lib/db');

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        try {
            const del = await query('DELETE FROM users WHERE first_name = $1 RETURNING id, first_name, one_win_user_id', ['Inconnu']);
            res.status(200).json({ deleted: del.length, users: del });
        } catch(e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        res.status(405).json({ error: 'GET only' });
    }
};
