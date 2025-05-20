const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Create a patrol
router.post('/patrols', authenticateToken, authorizeRoles('admin', 'security'), async (req, res) => {
  const { patrol_date, patrol_time, area, note } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO irondo_patrols (patrol_date, patrol_time, area, note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [patrol_date, patrol_time, area, note]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ CREATE PATROL ERROR:', err);
    res.status(500).json({ error: 'Failed to create patrol' });
  }
});

// Assign irondo team member to patrol
router.post('/assign', authenticateToken, authorizeRoles('admin', 'security'), async (req, res) => {
  const { patrol_id, team_member_id } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO irondo_members (patrol_id, team_member_id)
       VALUES ($1, $2) RETURNING *`,
      [patrol_id, team_member_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ ASSIGN IRONDO MEMBER ERROR:', err);
    res.status(500).json({ error: 'Failed to assign member' });
  }
});

// Get members in a patrol
router.get('/patrols/:id/members', authenticateToken, authorizeRoles('admin', 'security'), async (req, res) => {
  const patrol_id = parseInt(req.params.id);

  try {
    const { rows } = await pool.query(
      `SELECT im.id, t.full_name, t.phone, t.shift_type
       FROM irondo_members im
       JOIN irondo_team t ON im.team_member_id = t.id
       WHERE im.patrol_id = $1`,
      [patrol_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ GET PATROL MEMBERS ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch patrol members' });
  }
});

// Remove a member from a patrol
router.delete('/assign/:id', authenticateToken, authorizeRoles('admin', 'security'), async (req, res) => {
  const assignmentId = parseInt(req.params.id);

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM irondo_members WHERE id = $1',
      [assignmentId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Member unassigned from patrol' });
  } catch (err) {
    console.error('❌ DELETE ASSIGNMENT ERROR:', err);
    res.status(500).json({ error: 'Failed to remove member from patrol' });
  }
});
// Get all patrols with their assigned members
router.get('/patrols-with-members', authenticateToken, authorizeRoles('admin', 'security'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.id AS patrol_id,
        p.patrol_date,
        p.patrol_time,
        p.area,
        p.note,
        json_agg(
          json_build_object(
            'member_id', m.id,
            'full_name', t.full_name,
            'phone', t.phone,
            'shift_type', t.shift_type
          )
        ) AS members
      FROM irondo_patrols p
      LEFT JOIN irondo_members m ON m.patrol_id = p.id
      LEFT JOIN irondo_team t ON m.team_member_id = t.id
      GROUP BY p.id
      ORDER BY p.patrol_date DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('❌ GET PATROLS WITH MEMBERS ERROR:', err);
    res.status(500).json({ error: 'Failed to load patrol data' });
  }
});


module.exports = router;
