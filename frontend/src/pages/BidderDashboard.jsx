import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axiosClient';

const statusBadgeClasses = {
  Upcoming: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Active: 'bg-green-50 text-green-700 ring-green-600/20',
  Closed: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  Awarded: 'bg-purple-50 text-purple-700 ring-purple-600/20'
};

const BidderDashboard = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/my-tenders');
        setTenders(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tenders');
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">My Tenders</h1>
      {error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : tenders.length === 0 ? (
        <div className="text-gray-500 text-sm">No invited tenders.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Tender Status</th>
                <th className="px-4 py-3">My Bid</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenders.map((t) => {
                const tenderStatus = t.displayStatus;
                let resultLabel = '-';
                if (t.awardedBidId) {
                  resultLabel = t.isWinner ? 'Won' : 'Lost';
                } else if (tenderStatus === 'Closed') {
                  resultLabel = 'Closed (Not awarded yet)';
                }

                return (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{t.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          statusBadgeClasses[tenderStatus] || statusBadgeClasses.Closed
                        }`}
                      >
                        {tenderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {t.myBid ? t.myBid.bidAmount : <span className="text-gray-400">No bid</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{resultLabel}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      <Link
                        to={`/tenders/${t._id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BidderDashboard;


