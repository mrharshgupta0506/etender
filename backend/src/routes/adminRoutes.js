const express = require('express');
const {
  createTender,
  updateTender,
  listTenders,
  getTenderWithBids,
  awardTender
} = require('../controllers/tenderController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireRole('admin'));

// Admin tender management
router.post('/tenders', createTender);
router.put('/tenders/:id', updateTender);
router.get('/tenders', listTenders);
router.get('/tenders/:id/bids', getTenderWithBids);
router.post('/tenders/:id/award', awardTender);

module.exports = router;


