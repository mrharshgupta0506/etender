const bcrypt = require('bcryptjs');
const Tender = require('../models/Tender');
const User = require('../models/User');
const Bid = require('../models/Bid');
const generateRandomPassword = require('../utils/generatePassword');
const { sendInvitationEmail, sendWinnerEmail } = require('../services/emailService');

const COMPANY_ID = process.env.COMPANY_ID || 'COMPANY_1';

const computeTenderDisplayStatus = (tender) => {
  const now = new Date();
  if (tender.awardedBidId) {
    return 'Awarded';
  }
  if (now < tender.startDate) {
    return 'Upcoming';
  }
  if (now >= tender.startDate && now <= tender.endDate) {
    return 'Active';
  }
  return 'Closed';
};

// Helper to sync persisted status for awarded only (dates drive other statuses)
const attachDisplayStatus = (tenderDoc) => {
  const obj = tenderDoc.toObject ? tenderDoc.toObject() : tenderDoc;
  return {
    ...obj,
    displayStatus: computeTenderDisplayStatus(obj)
  };
};

// POST /tenders (admin)
const createTender = async (req, res, next) => {
  try {
    const {
      name,
      description,
      startBidPrice,
      maxBidPrice,
      startDate,
      endDate,
      invitedEmails,
      status
    } = req.body;

    if (!name || !description || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required tender fields' });
    }

    const tender = await Tender.create({
      companyId: COMPANY_ID,
      name,
      description,
      startBidPrice,
      maxBidPrice,
      startDate,
      endDate,
      invitedEmails: (invitedEmails || []).map((e) => e.toLowerCase().trim()),
      status: status || 'draft'
    });

    // If published, handle user creation and invitations
    if (tender.status === 'published') {
      await handleTenderPublication(tender);
    }

    res.status(201).json(attachDisplayStatus(tender));
  } catch (err) {
    next(err);
  }
};

// PUT /tenders/:id (admin) - edit & publish
const updateTender = async (req, res, next) => {
  try {
    const tenderId = req.params.id;
    const updates = { ...req.body };

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ message: 'Tender not found' });
    }

    const now = new Date();
    if (now >= tender.startDate) {
      return res.status(400).json({ message: 'Tender cannot be edited after start date' });
    }

    const wasPublished = tender.status === 'published';

    const allowedFields = [
      'name',
      'description',
      'startBidPrice',
      'maxBidPrice',
      'startDate',
      'endDate',
      'invitedEmails',
      'status'
    ];

    allowedFields.forEach((field) => {
      if (typeof updates[field] !== 'undefined') {
        if (field === 'invitedEmails') {
          tender.invitedEmails = (updates.invitedEmails || []).map((e) =>
            e.toLowerCase().trim()
          );
        } else {
          tender[field] = updates[field];
        }
      }
    });

    await tender.save();

    // Handle publish flow: when status becomes 'published' from non-published
    if (!wasPublished && tender.status === 'published') {
      await handleTenderPublication(tender);
    }

    res.json(attachDisplayStatus(tender));
  } catch (err) {
    next(err);
  }
};

// internal: on publish, ensure users and send invitations
const handleTenderPublication = async (tender) => {
  const emails = (tender.invitedEmails || []).map((e) => e.toLowerCase().trim());
  if (!emails.length) return;

  const existingUsers = await User.find({ email: { $in: emails } });
  const existingMap = new Map(existingUsers.map((u) => [u.email, u]));

  for (const email of emails) {
    let user = existingMap.get(email);
    let generatedPassword;
    let isNewUser = false;

    if (!user) {
      generatedPassword = generateRandomPassword(10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);
      user = await User.create({
        email,
        password: hashedPassword,
        role: 'bidder'
      });
      isNewUser = true;
    }

    await sendInvitationEmail({
      to: email,
      tender,
      isNewUser,
      password: generatedPassword,
      userEmail: email
    });
  }
};

// GET /tenders (admin)
const listTenders = async (req, res, next) => {
  try {
    const tenders = await Tender.find({ companyId: COMPANY_ID }).sort({ createdAt: -1 }).lean();
    const tenderIds = tenders.map((t) => t._id);
    const bidCounts = await Bid.aggregate([
      { $match: { tenderId: { $in: tenderIds } } },
      { $group: { _id: '$tenderId', count: { $sum: 1 } } }
    ]);
    const bidCountMap = new Map(bidCounts.map((b) => [b._id.toString(), b.count]));

    const enriched = tenders.map((t) => ({
      ...attachDisplayStatus(t),
      bidCount: bidCountMap.get(t._id.toString()) || 0
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

// GET /tenders/:id/bids (admin or invited bidder)
const getTenderWithBids = async (req, res, next) => {
  try {
    const tenderId = req.params.id;
    const tender = await Tender.findById(tenderId).lean();
    if (!tender) {
      return res.status(404).json({ message: 'Tender not found' });
    }

    // Authorization: admin or invited bidder
    const isAdmin = req.user.role === 'admin';
    const isInvited =
      req.user.role === 'bidder' &&
      (tender.invitedEmails || []).map((e) => e.toLowerCase()).includes(req.user.email);
    if (!isAdmin && !isInvited) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const bids = await Bid.find({ tenderId }).populate('bidderId', 'email role').lean();

    res.json({
      tender: attachDisplayStatus(tender),
      bids
    });
  } catch (err) {
    next(err);
  }
};

// POST /tenders/:id/award (admin)
const awardTender = async (req, res, next) => {
  try {
    const tenderId = req.params.id;
    const { bidId } = req.body;

    if (!bidId) {
      return res.status(400).json({ message: 'bidId is required' });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ message: 'Tender not found' });
    }

    const now = new Date();
    if (now < tender.endDate) {
      return res.status(400).json({ message: 'Cannot award tender before end date' });
    }

    const bid = await Bid.findOne({ _id: bidId, tenderId }).populate('bidderId', 'email').lean();
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found for this tender' });
    }

    tender.awardedBidId = bidId;
    tender.status = 'awarded';
    await tender.save();

    // Notify all bidders including winner
    const allBids = await Bid.find({ tenderId }).populate('bidderId', 'email').lean();
    const allBidderEmails = allBids.map((b) => b.bidderId?.email).filter(Boolean);

    await sendWinnerEmail({
      tender,
      winningBid: bid,
      bidderEmail: bid.bidderId.email,
      allBidderEmails
    });

    res.json(attachDisplayStatus(tender));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTender,
  updateTender,
  listTenders,
  getTenderWithBids,
  awardTender
};


