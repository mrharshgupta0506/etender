const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    startBidPrice: {
      type: Number
    },
    maxBidPrice: {
      type: Number
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    invitedEmails: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      default: 'draft'
      // logical statuses:
      // draft, published, awarded
    },
    awardedBidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid'
    }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

module.exports = mongoose.model('Tender', tenderSchema);


