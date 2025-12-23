const express = require('express');
const { getMyTenders, createBid, updateBid } = require('../controllers/bidController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getTenderWithBids } = require('../controllers/tenderController');

const router = express.Router();

// Bidder dashboard tenders (allow admin too for testing)
router.get('/my-tenders', authMiddleware, getMyTenders);

// Bid management
router.post('/bids', authMiddleware, requireRole('bidder'), createBid);
router.put('/bids/:id', authMiddleware, requireRole('bidder'), updateBid);

// Tender details with bids (shared with admin, but limited to invited bidders)
router.get('/tenders/:id/bids', authMiddleware, getTenderWithBids);

module.exports = router;


