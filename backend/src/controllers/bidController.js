const Tender = require('../models/Tender');
const Bid = require('../models/Bid');

const validateBidWindow = (tender) => {
  const now = new Date();
  if (now < tender.startDate || now > tender.endDate) {
    const when = now < tender.startDate ? 'before start date' : 'after end date';
    const error = new Error(`Bidding is not allowed ${when}`);
    error.statusCode = 400;
    throw error;
  }
};

const validateBidAmount = (tender, bidAmount) => {
  if (typeof tender.startBidPrice === 'number' && bidAmount < tender.startBidPrice) {
    const error = new Error('Bid amount is below minimum start bid price');
    error.statusCode = 400;
    throw error;
  }
  if (typeof tender.maxBidPrice === 'number' && bidAmount > tender.maxBidPrice) {
    const error = new Error('Bid amount exceeds maximum bid price');
    error.statusCode = 400;
    throw error;
  }
};

// GET /my-tenders (bidder)
const getMyTenders = async (req, res, next) => {
  try {
    const email = req.user.email.toLowerCase();
    const tenders = await Tender.find({
      invitedEmails: email
    })
      .sort({ createdAt: -1 })
      .lean();

    const tenderIds = tenders.map((t) => t._id);

    const myBids = await Bid.find({
      tenderId: { $in: tenderIds },
      bidderId: req.user.id
    }).lean();
    const myBidMap = new Map(myBids.map((b) => [b.tenderId.toString(), b]));

    const allBids = await Bid.find({
      tenderId: { $in: tenderIds }
    }).lean();
    const bidCountMap = new Map();
    allBids.forEach((b) => {
      const key = b.tenderId.toString();
      bidCountMap.set(key, (bidCountMap.get(key) || 0) + 1);
    });

    const now = new Date();

    const items = tenders.map((t) => {
      let displayStatus;
      if (t.awardedBidId) {
        displayStatus = 'Awarded';
      } else if (now < t.startDate) {
        displayStatus = 'Upcoming';
      } else if (now >= t.startDate && now <= t.endDate) {
        displayStatus = 'Active';
      } else {
        displayStatus = 'Closed';
      }

      const myBid = myBidMap.get(t._id.toString()) || null;

      const isWinner =
        t.awardedBidId && myBid && t.awardedBidId.toString() === myBid._id.toString();

      return {
        ...t,
        displayStatus,
        bidCount: bidCountMap.get(t._id.toString()) || 0,
        myBid,
        isWinner
      };
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
};

// POST /bids (bidder)
const createBid = async (req, res, next) => {
  try {
    const { tenderId, bidAmount, remarks } = req.body;
    if (!tenderId || typeof bidAmount !== 'number') {
      return res.status(400).json({ message: 'tenderId and bidAmount are required' });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ message: 'Tender not found' });
    }

    const email = req.user.email.toLowerCase();
    if (!(tender.invitedEmails || []).map((e) => e.toLowerCase()).includes(email)) {
      return res.status(403).json({ message: 'You are not invited to this tender' });
    }

    validateBidWindow(tender);
    validateBidAmount(tender, bidAmount);

    const existingBid = await Bid.findOne({
      tenderId,
      bidderId: req.user.id
    });
    if (existingBid) {
      return res.status(400).json({ message: 'You have already placed a bid for this tender' });
    }

    const bid = await Bid.create({
      tenderId,
      bidderId: req.user.id,
      bidAmount,
      remarks
    });

    res.status(201).json(bid);
  } catch (err) {
    next(err);
  }
};

// PUT /bids/:id (bidder)
const updateBid = async (req, res, next) => {
  try {
    const bidId = req.params.id;
    const { bidAmount, remarks } = req.body;

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    if (bid.bidderId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own bid' });
    }

    const tender = await Tender.findById(bid.tenderId);
    if (!tender) {
      return res.status(404).json({ message: 'Tender not found' });
    }

    const now = new Date();
    if (now > tender.endDate) {
      return res.status(400).json({ message: 'Bids cannot be edited after tender end date' });
    }

    if (typeof bidAmount === 'number') {
      validateBidAmount(tender, bidAmount);
      bid.bidAmount = bidAmount;
    }
    if (typeof remarks !== 'undefined') {
      bid.remarks = remarks;
    }

    await bid.save();

    res.json(bid);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyTenders,
  createBid,
  updateBid
};


