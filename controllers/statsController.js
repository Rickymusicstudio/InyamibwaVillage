const pool = require('../config/db');

exports.getCellStats = async (req, res) => {
  const { role } = req.user;

  // Allow only admin and cell_leader
  if (!['admin', 'cell_leader'].includes(role)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const [residents, uniqueIsibos, helpers, irondo] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM residents`),
      pool.query(`SELECT COUNT(DISTINCT isibo) FROM residents`),
      pool.query(`SELECT COUNT(*) FROM house_helpers`),
      pool.query(`SELECT COUNT(*) FROM irondo_members`),
    ]);

    res.json({
      residents: parseInt(residents.rows[0].count),
      isibos: parseInt(uniqueIsibos.rows[0].count),
      helpers: parseInt(helpers.rows[0].count),
      irondo: parseInt(irondo.rows[0].count),
    });
  } catch (err) {
    console.error('❌ Failed to fetch stats:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
};
