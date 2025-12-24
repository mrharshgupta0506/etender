import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const statusBadgeClasses = {
  Upcoming: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Active: 'bg-green-50 text-green-700 ring-green-600/20',
  Closed: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  Awarded: 'bg-purple-50 text-purple-700 ring-purple-600/20'
};

const TenderDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSaving, setBidSaving] = useState(false);
  const [awardError, setAwardError] = useState('');
  const [awardSaving, setAwardSaving] = useState(false);
const fetchData = async () => {
      try {
        const res = await apiClient.get(`/tenders/${id}/bids`);
        console.log("Response data:", res.data);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tender');
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    fetchData();
  }, [id]);

  const tender = data?.tender;
  const bids = data?.bids || [];

  const myBid = useMemo(() => {
    if (!user) return null;
    return bids.find((b) => b.bidderId?._id === user.id) || null;
  }, [bids, user]);

  useEffect(() => {
    if (myBid) {
      setBidAmount(myBid.bidAmount);
      setRemarks(myBid.remarks || '');
    }
  }, [myBid]);

  const canBidOrEdit = useMemo(() => {
    if (!tender || !user || user.role !== 'bidder') return false;
    if (tender.awardedBidId) return false;
    const now = new Date();
    const start = new Date(tender.startDate);
    const end = new Date(tender.endDate);
    return now >= start && now <= end;
  }, [tender, user]);

  const isAwarded = Boolean(tender?.awardedBidId);

  const winningBid = useMemo(() => {
    if (!isAwarded) return null;
    return bids.find((b) => b._id === tender.awardedBidId) || null;
  }, [bids, tender, isAwarded]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError('');

    const amountNumber = Number(bidAmount);
    if (!amountNumber || Number.isNaN(amountNumber)) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    try {
      setBidSaving(true);
      if (myBid) {
        const res = await apiClient.put(`/bids/${myBid._id}`, {
          bidAmount: amountNumber,
          remarks
        });
        setData((prev) => ({
          ...prev,
          bids: prev.bids.map((b) => (b._id === myBid._id ? { ...b, ...res.data } : b))
        }));
      } else {
        const res = await apiClient.post('/bids', {
          tenderId: id,
          bidAmount: amountNumber,
          remarks
        });
        setData((prev) => ({
          ...prev,
          bids: [...prev.bids, res.data]
        }));
      }
      fetchData()
    } catch (err) {
      setBidError(err.response?.data?.message || 'Failed to submit bid');
    } finally {
      setBidSaving(false);
    }
  };

  const handleAward = async (bidId) => {
    if (!window.confirm('Are you sure you want to award this bid?')) return;
    setAwardError('');
    try {
      setAwardSaving(true);
      const res = await apiClient.post(`/admin/tenders/${id}/award`, { bidId });
      setData((prev) => ({
        ...prev,
        tender: res.data
      }));
    } catch (err) {
      setAwardError(err.response?.data?.message || 'Failed to award tender');
    } finally {
      setAwardSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading tender...</div>;
  }

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!tender) {
    return <div className="text-gray-500 text-sm">Tender not found.</div>;
  }

  const displayStatus = tender.displayStatus || 'Closed';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">{tender.name}</h1>
          <p className="text-gray-600 text-sm max-w-2xl whitespace-pre-line">
            {tender.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
            <span>
              Start:{' '}
              <span className="font-medium text-gray-700">
                {tender.startDate ? new Date(tender.startDate).toLocaleString() : '-'}
              </span>
            </span>
            <span>
              End:{' '}
              <span className="font-medium text-gray-700">
                {tender.endDate ? new Date(tender.endDate).toLocaleString() : '-'}
              </span>
            </span>
            {typeof tender.startBidPrice === 'number' && (
              <span>
                Min: <span className="font-medium text-gray-700">{tender.startBidPrice}</span>
              </span>
            )}
            {typeof tender.maxBidPrice === 'number' && (
              <span>
                Max: <span className="font-medium text-gray-700">{tender.maxBidPrice}</span>
              </span>
            )}
          </div>
        </div>
        <div className="text-right space-y-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
              statusBadgeClasses[displayStatus] || statusBadgeClasses.Closed
            }`}
          >
            {displayStatus}
          </span>
          {winningBid && (
            <div className="text-xs text-gray-600">
              <div className="font-semibold text-gray-800">Awarded Bid</div>
              <div>Amount: {winningBid.bidAmount}</div>
            </div>
          )}
        </div>
      </div>

      {user?.role === 'bidder' && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-md">
          <h2 className="text-sm font-semibold mb-2 text-gray-800">
            {myBid ? 'Your Bid' : 'Place Your Bid'}
          </h2>
          {bidError && (
            <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {bidError}
            </div>
          )}
          <form onSubmit={handleBidSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount</label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                disabled={!canBidOrEdit}
                placeholder="Enter your bid amount"
                className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={!canBidOrEdit}
                placeholder="Enter any remarks (optional)"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!canBidOrEdit || bidSaving}
              className="px-4 py-2 rounded-md bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {bidSaving ? 'Saving...' : myBid ? 'Update Bid' : 'Submit Bid'}
            </button>
            {!canBidOrEdit && (
              <p className="mt-1 text-xs text-gray-500">
                Bids can only be created or edited while the tender is active.
              </p>
            )}
          </form>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-800">All Bids</h2>
          {awardError && (
            <span className="text-xs text-red-600">{awardError}</span>
          )}
        </div>
        {bids.length === 0 ? (
          <div className="text-xs text-gray-500">No bids yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-2">Bidder</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Remarks</th>
                  <th className="px-3 py-2">Created</th>
                  {user?.role === 'admin' && <th className="px-3 py-2"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bids.map((bid) => {
                  const isWinnerRow =
                    tender.awardedBidId && tender.awardedBidId === bid._id;
                  return (
                    <tr
                      key={bid._id}
                      className={isWinnerRow ? 'bg-purple-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-3 py-2 text-gray-800">
                        {bid.bidderId?.email || 'N/A'}
                        {user?.id === bid.bidderId?._id && (
                          <span className="ml-1 text-[10px] text-gray-500">(You)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-800">{bid.bidAmount}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {bid.remarks || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {bid.createdAt ? new Date(bid.createdAt).toLocaleString() : '-'}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-3 py-2 text-right">
                          {!tender.awardedBidId && (
                            <button
                              onClick={() => handleAward(bid._id)}
                              disabled={awardSaving}
                              className="text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              {awardSaving ? 'Awarding...' : 'Award'}
                            </button>
                          )}
                          {isWinnerRow && (
                            <span className="ml-2 text-[11px] text-purple-700 font-semibold">
                              Winner
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenderDetailsPage;


