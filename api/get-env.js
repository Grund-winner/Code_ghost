module.exports = async function handler(req, res) {
    const dbUrl = process.env.DATABASE_URL || '';
    const regLink = process.env.REG_LINK || '';
    const adminPwd = process.env.ADMIN_PASSWORD || '';
    const adminIds = process.env.ADMIN_IDS || '';
    
    res.json({
        DATABASE_URL: dbUrl,
        REG_LINK: regLink,
        ADMIN_PASSWORD: adminPwd,
        ADMIN_IDS: adminIds,
        MIN_DEPOSIT: process.env.MIN_DEPOSIT || '8.5'
    });
};
