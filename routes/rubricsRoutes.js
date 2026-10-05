import express from 'express';
import BatchTimeline from '../models/BatchTimeline.js';

const router = express.Router();

// GET all timelines for a specific batch
router.get('/batch-timelines', async (req, res) => {
  try {
    const { batch } = req.query; // ?batch=24IPD

    if (!batch) {
      return res.status(400).json({ error: 'Batch parameter is required' });
    }

    const timelines = await BatchTimeline.findAll({
      where: { batch },
      order: [['stage', 'ASC']]
    });

    res.json(timelines);
  } catch (err) {
    console.error('Error fetching batch timelines:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a specific stage's deadline for a batch
router.get('/deadline/:stage', async (req, res) => {
  try {
    const { stage } = req.params;
    const { batch } = req.query; // ?batch=24IPD

    if (!batch) {
      return res.json({ start: null, deadline: null });
    }

    const row = await BatchTimeline.findOne({ where: { batch, stage } });
    res.json({ start: row?.start || null, deadline: row?.deadline || null });
  } catch (err) {
    console.error('Error fetching timeline:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// SAVE/UPDATE a stage's deadline for a specific batch
router.post('/deadline/:stage', async (req, res) => {
  try {
    const { stage } = req.params;
    const { start, deadline, batch } = req.body;

    if (!batch) {
      return res.status(400).json({ error: 'Batch is required' });
    }

    const [row, created] = await BatchTimeline.findOrCreate({
      where: { batch, stage },
      defaults: { start, deadline }
    });

    if (!created) {
      row.start = start;
      row.deadline = deadline;
      await row.save();
    }

    res.json({
      message: `${stage} timeline saved for batch ${batch}`,
      data: row
    });
  } catch (err) {
    console.error('Error saving timeline:', err);
    res.status(500).json({ error: 'Failed to save timeline' });
  }
});

// BULK SAVE - Save all timelines for a batch at once
router.post('/batch-timelines/bulk', async (req, res) => {
  try {
    const { batch, timelines } = req.body;

    if (!batch || !Array.isArray(timelines)) {
      return res.status(400).json({ error: 'Batch and timelines array required' });
    }

    const promises = timelines.map(async ({ stage, start, deadline }) => {
      const [row, created] = await BatchTimeline.findOrCreate({
        where: { batch, stage },
        defaults: { start, deadline }
      });

      if (!created) {
        row.start = start;
        row.deadline = deadline;
        await row.save();
      }

      return row;
    });

    const results = await Promise.all(promises);

    res.json({
      message: `${results.length} timelines saved for batch ${batch}`,
      data: results
    });
  } catch (err) {
    console.error('Error bulk saving timelines:', err);
    res.status(500).json({ error: 'Failed to bulk save timelines' });
  }
});

// DELETE a timeline entry
router.delete('/deadline/:stage', async (req, res) => {
  try {
    const { stage } = req.params;
    const { batch } = req.query;

    if (!batch) {
      return res.status(400).json({ error: 'Batch is required' });
    }

    await BatchTimeline.destroy({ where: { batch, stage } });

    res.json({ message: `Timeline for ${stage} in batch ${batch} deleted` });
  } catch (err) {
    console.error('Error deleting timeline:', err);
    res.status(500).json({ error: 'Failed to delete timeline' });
  }
});

export default router;
