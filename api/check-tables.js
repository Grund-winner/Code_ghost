// ═══════════════════════════════════════════════════════
// EURO54 - Vérification / Création des tables
// Route : GET /api/check-tables
// ═══════════════════════════════════════════════════════
const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
    try {
        // Créer les tables si elles n'existent pas
        await query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            telegram_id BIGINT UNIQUE,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            is_registered BOOLEAN DEFAULT FALSE,
            is_deposited BOOLEAN DEFAULT FALSE,
            deposit_amount NUMERIC DEFAULT 0,
            one_win_user_id TEXT,
            last_message_id BIGINT,
            registered_at TIMESTAMPTZ,
            deposited_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )`);

        await query(`CREATE TABLE IF NOT EXISTS deposits (
            id SERIAL PRIMARY KEY,
            one_win_user_id TEXT NOT NULL,
            telegram_id BIGINT,
            amount NUMERIC NOT NULL DEFAULT 0,
            transaction_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`);

        await query(`CREATE TABLE IF NOT EXISTS access_codes (
            id SERIAL PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            telegram_id BIGINT,
            is_used BOOLEAN DEFAULT FALSE,
            used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`);

        // Lister les tables existantes
        const tables = await query(`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name IN ('users', 'deposits', 'access_codes')
            ORDER BY table_name, ordinal_position
        `);

        // Compter les enregistrements
        const userCount = await query('SELECT COUNT(*) as cnt FROM users');
        const depCount = await query('SELECT COUNT(*) as cnt FROM deposits');

        res.status(200).json({
            status: 'OK',
            tables: tables,
            counts: {
                users: parseInt(userCount[0].cnt),
                deposits: parseInt(depCount[0].cnt)
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: error.message });
    }
};
