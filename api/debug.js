const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
    
    try {
        const tid = req.query.tid || '2120696159';
        const results = {};
        
        // 1. Check session
        const session = await query("SELECT * FROM bot_sessions WHERE bot_type = 'main' AND admin_id = $1", [tid]);
        results.session = session.length > 0 ? session[0] : 'NO SESSION';
        
        // 2. Check user by telegram_id
        const byTg = await query('SELECT id, first_name, telegram_id, one_win_user_id, is_registered, is_deposited, deposit_amount FROM users WHERE telegram_id = $1', [tid]);
        results.user_by_telegram = byTg;
        
        // 3. Check user by potential 1win ID
        const testWinId = req.query.winid || '123456789';
        const byWin = await query('SELECT id, first_name, telegram_id, one_win_user_id, is_registered, is_deposited, deposit_amount FROM users WHERE one_win_user_id = $1', [testWinId]);
        results.user_by_1win = byWin;
        
        // 4. All sessions
        const allSessions = await query("SELECT * FROM bot_sessions");
        results.all_sessions = allSessions;
        
        // 5. All users
        const allUsers = await query('SELECT id, first_name, telegram_id, one_win_user_id FROM users ORDER BY id');
        results.all_users = allUsers;
        
        res.status(200).json(results);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
};
