const pool = require('../config/db');

exports.createYouthLeader = async (req, res) => {
  const { fullName, nationalID, phone, email, house, isibo, residentType } = req.body;

  if (!fullName || !nationalID || !phone || !email) {
    return res.status(400).json({ message: 'Full Name, National ID, Phone, and Email are required.' });
  }

  try {
    const newLeader = await pool.query(
      `INSERT INTO youth_leaders (full_name, national_id, phone, email, house, isibo, resident_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [fullName, nationalID, phone, email, house || null, isibo || null, residentType || null]
    );

    res.status(201).json({
      message: 'Youth Leader created successfully.',
      leader: newLeader.rows[0]
    });
  } catch (err) {
    console.error('❌ Error creating Youth Leader:', err);
    res.status(500).json({ message: 'Failed to create Youth Leader.' });
  }
};

exports.getYouthLeaders = async (req, res) => {
  try {
    const leaders = await pool.query('SELECT * FROM youth_leaders ORDER BY id DESC');
    res.json(leaders.rows);
  } catch (err) {
    console.error('❌ Error fetching Youth Leaders:', err);
    res.status(500).json({ message: 'Failed to fetch Youth Leaders.' });
  }
};
 
