const pool = require('../config/db');

// ✅ Resident sends a message
exports.addMessage = async (req, res) => {
  const userId = req.user.id;
  const { to, isibo, message } = req.body;
  const attachment = req.file ? req.file.filename : null;

  if (!to || !message) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  if (to === 'isibo_leader' && !isibo) {
    return res.status(400).json({ error: 'Isibo is required for isibo leader' });
  }

  if (req.file && !req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Only image attachments are allowed' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (from_user_id, to_role, isibo, message, attachment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, to, isibo || null, message, attachment]
    );

    res.status(201).json({ message: 'Message sent!', data: result.rows[0] });
  } catch (err) {
    console.error('❌ addMessage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ View messages for a leader (updated to include security_dashboard)
exports.getMessagesForLeader = async (req, res) => {
  const role = req.query.role;
  const user = req.user;

  if (!role || !['cell_leader', 'isibo_leader', 'security_leader', 'security_dashboard'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    let query = '';
    let params = [];

    if (role === 'cell_leader') {
      query = `
        SELECT m.*, r.full_name, r.phone_number, r.isibo,
          CASE 
            WHEN m.reply IS NOT NULL THEN 'Replied'
            ELSE 'Pending'
          END AS status
        FROM messages m
        JOIN users u ON m.from_user_id = u.id
        JOIN residents r ON u.resident_id = r.id
        WHERE m.to_role = 'cell_leader'
        ORDER BY m.created_at DESC
      `;
    } else if (role === 'isibo_leader') {
      const identifier = user.email || user.phone_number || user.phone;
      const result = await pool.query(
        `SELECT isibo FROM isibo_leaders WHERE email = $1 OR phone = $1`,
        [identifier]
      );
      const leaderIsibo = result.rows[0]?.isibo;

      if (!leaderIsibo) {
        console.warn(`⚠️ No isibo found for leader with identifier: ${identifier}`);
        return res.status(403).json({ error: 'Leader has no assigned isibo' });
      }

      query = `
        SELECT m.*, r.full_name, r.phone_number, r.isibo,
          CASE 
            WHEN m.reply IS NOT NULL THEN 'Replied'
            ELSE 'Pending'
          END AS status
        FROM messages m
        JOIN users u ON m.from_user_id = u.id
        JOIN residents r ON u.resident_id = r.id
        WHERE m.to_role = 'isibo_leader' AND m.isibo = $1
        ORDER BY m.created_at DESC
      `;
      params = [leaderIsibo];
    } else if (role === 'security_leader' || role === 'security_dashboard') {
      query = `
        SELECT m.*, r.full_name, r.phone_number, r.isibo,
          CASE 
            WHEN m.reply IS NOT NULL THEN 'Replied'
            ELSE 'Pending'
          END AS status
        FROM messages m
        JOIN users u ON m.from_user_id = u.id
        JOIN residents r ON u.resident_id = r.id
        WHERE m.to_role = 'security_leader'
        ORDER BY m.created_at DESC
      `;
    }

    const messages = await pool.query(query, params);
    res.json(messages.rows);

  } catch (err) {
    console.error('❌ getMessagesForLeader error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ View messages sent by resident
exports.getMyMessages = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      SELECT id, to_role, isibo, message, reply, attachment, created_at, replied_at
      FROM messages
      WHERE from_user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ getMyMessages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// ✅ Leader replies to a resident's message
exports.replyToMessage = async (req, res) => {
  const { messageId } = req.params;
  const { reply } = req.body;
  const repliedAt = new Date();

  if (!reply) {
    return res.status(400).json({ error: 'Reply content is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE messages
       SET reply = $1, replied_at = $2
       WHERE id = $3
       RETURNING *`,
      [reply, repliedAt, messageId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.status(200).json({ message: 'Reply saved', data: result.rows[0] });
  } catch (err) {
    console.error('❌ replyToMessage error:', err);
    res.status(500).json({ error: 'Server error while replying' });
  }
};
