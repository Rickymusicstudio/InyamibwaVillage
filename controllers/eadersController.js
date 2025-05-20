const pool = require('../config/db');

exports.getCellStats = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get cell name from this user's resident record
    const cellResult = await pool.query(
      `SELECT cell FROM residents WHERE id = $1`,
      [userId]
    );
    const cellName = cellResult.rows[0]?.cell;
    if (!cellName) return res.status(400).json({ error: 'No cell assigned' });

    const [residents, households, helpers, messages, updates, irondo] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM residents WHERE cell = $1`, [cellName]),
      pool.query(`SELECT COUNT(DISTINCT house) FROM residents WHERE cell = $1`, [cellName]),
      pool.query(`SELECT COUNT(*) FROM house_helpers h JOIN residents r ON r.id = h.resident_id WHERE r.cell = $1`, [cellName]),
      pool.query(`SELECT COUNT(*) FROM messages m JOIN users u ON u.id = m.to_user WHERE u.role = 'cell_leader' AND u.resident_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*) FROM thoughts WHERE category = 'update' AND posted_by = 'cell_leader' AND user_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*) FROM irondo_members WHERE cell = $1`, [cellName])
    ]);

    res.json({
      cell: cellName,
      residents: Number(residents.rows[0].count),
      households: Number(households.rows[0].count),
      helpers: Number(helpers.rows[0].count),
      messages: Number(messages.rows[0].count),
      updates: Number(updates.rows[0].count),
      irondo: Number(irondo.rows[0].count)
    });
  } catch (err) {
    console.error('📊 getCellStats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
