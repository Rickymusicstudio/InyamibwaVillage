const pool = require('../config/db');

// ➕ Add new thought or update
exports.addThought = async (req, res) => {
  const userId = req.user.id;
  const { message, category = 'general' } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const result = await pool.query(
      `INSERT INTO thoughts (user_id, message, category, posted_by, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [userId, message, category, req.user.role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add thought error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 📜 Get general thoughts
// 📜 Get general thoughts with optional exclude
exports.getThoughts = async (req, res) => {
  const { category, exclude } = req.query;

  try {
    let query = `
      SELECT t.*, r.full_name, r.phone_number
      FROM thoughts t
      JOIN users u ON t.user_id = u.id
      JOIN residents r ON u.resident_id = r.id
    `;
    const params = [];

    if (category) {
      query += ` WHERE t.category = $1 ORDER BY t.created_at DESC`;
      params.push(category);
    } else if (exclude) {
      query += ` WHERE t.category IS DISTINCT FROM $1 ORDER BY t.created_at DESC`;
      params.push(exclude);
    } else {
      query += ` ORDER BY t.created_at DESC`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch thoughts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



// 📢 Get community updates
exports.getUpdates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, r.full_name, r.phone_number
      FROM thoughts t
      JOIN users u ON t.user_id = u.id
      JOIN residents r ON u.resident_id = r.id
      WHERE category = 'update'
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch updates error:', err);
    res.status(500).json({ error: 'Failed to load updates' });
  }
};

// ❌ Delete a thought
exports.deleteThought = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    await pool.query('DELETE FROM thoughts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Thought deleted' });
  } catch (err) {
    console.error('Delete thought error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 💬 Add a comment
exports.addComment = async (req, res) => {
  const userId = req.user.id;
  const { comment } = req.body;
  const { id: thoughtId } = req.params;

  if (!comment) return res.status(400).json({ error: 'Comment is required' });

  try {
    await pool.query(
      `INSERT INTO comments (thought_id, user_id, comment, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [thoughtId, userId, comment]
    );
    res.json({ message: 'Comment added' });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 💬 Get comments
exports.getComments = async (req, res) => {
  const { id: thoughtId } = req.params;

  try {
    const result = await pool.query(`
      SELECT c.*, r.full_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN residents r ON u.resident_id = r.id
      WHERE c.thought_id = $1
      ORDER BY c.created_at ASC
    `, [thoughtId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch comments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
