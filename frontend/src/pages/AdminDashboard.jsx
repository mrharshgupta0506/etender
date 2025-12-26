import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import apiClient from '../api/axiosClient';
import { formatDate } from '../utils/user';

const statusBadgeClasses = {
  Upcoming: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Active: 'bg-green-50 text-green-700 ring-green-600/20',
  Closed: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  Awarded: 'bg-purple-50 text-purple-700 ring-purple-600/20'
};

const AdminDashboard = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/admin/tenders');
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={() => navigate('/admin/tenders/new')}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Tender
        </button>
      </div>
      {error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading tenders...</div>
      ) : tenders.length === 0 ? (
        <div className="text-gray-500 text-sm">No tenders yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Bids</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenders.map((tender) => (
                <tr key={tender._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">{tender.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        statusBadgeClasses[tender.displayStatus] || statusBadgeClasses.Closed
                      }`}
                    >
                      {tender.displayStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{tender.bidCount || 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {tender.startDate ? formatDate(tender.startDate) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {tender.endDate ? formatDate(tender.endDate) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/tenders/${tender._id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Edit
                      </button>
                      <Link
                        to={`/tenders/${tender._id}`}
                        className="text-gray-700 hover:text-gray-900 font-medium"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


