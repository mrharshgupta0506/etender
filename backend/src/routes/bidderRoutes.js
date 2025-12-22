const express = require('express');
const { getMyTenders, createBid, updateBid } = require('../controllers/bidController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getTenderWithBids } = require('../controllers/tenderController');

const router = express.Router();

router.use(authMiddleware, requireRole('bidder'));

// Bidder dashboard tenders
router.get('/my-tenders', getMyTenders);

// Bid management
router.post('/bids', createBid);
router.put('/bids/:id', updateBid);

// Tender details with bids (shared with admin, but limited to invited bidders)
router.get('/tenders/:id/bids', getTenderWithBids);

module.exports = router;


