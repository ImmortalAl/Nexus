const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Fetch debates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const debates = [];
    res.json(debates);
  } catch (error) {
    console.error('Fetch debates error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create debate
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic required' });
    }
    const debate = { id: Date.now(), topic };
    res.json({ message: 'Debate created', debate });
  } catch (error) {
    console.error('Create debate error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create debate from a scroll (Soul Scroll challenge)
router.post('/from-scroll', authMiddleware, async (req, res) => {
  try {
    const { sourceScrollId, scrollTitle, originalAuthorId } = req.body;

    if (!sourceScrollId || !scrollTitle) {
      return res.status(400).json({ error: 'Source scroll ID and title are required' });
    }

    // TODO: Full debate implementation - for now return placeholder
    const debate = {
      id: Date.now(),
      sourceScrollId,
      scrollTitle,
      originalAuthorId,
      challengerId: req.user.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    res.json({
      message: 'Debate challenge initiated',
      debate,
      note: 'Full debate system coming soon'
    });
  } catch (error) {
    console.error('Create debate from scroll error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Vote on debate
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body;
    if (!vote) {
      return res.status(400).json({ error: 'Vote required' });
    }
    const debate = { id, vote }; // Placeholder: Replace with MongoDB
    res.json({ message: 'Vote recorded', debate });
  } catch (error) {
    console.error('Vote error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;