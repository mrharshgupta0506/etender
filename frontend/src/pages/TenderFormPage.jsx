import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axiosClient';

const TenderFormPage = () => {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    startBidPrice: '',
    maxBidPrice: '',
    startDate: '',
    endDate: '',
    invitedEmails: '',
    status: 'draft'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialStartDate, setInitialStartDate] = useState(null);

  useEffect(() => {
    const loadTender = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        const res = await apiClient.get(`/admin/tenders/${id}/bids`);
        const tender = res.data.tender;

        const formatDateTimeLocal = (date) => {
          if (!date) return '';
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setForm({
          name: tender.name || '',
          description: tender.description || '',
          startBidPrice: tender.startBidPrice ?? '',
          maxBidPrice: tender.maxBidPrice ?? '',
          startDate: formatDateTimeLocal(tender.startDate),
          endDate: formatDateTimeLocal(tender.endDate),
          invitedEmails: (tender.invitedEmails || []).join(', '),
          status: tender.status || 'draft'
        });
        setInitialStartDate(tender.startDate ? new Date(tender.startDate) : null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tender');
      } finally {
        setLoading(false);
      }
    };
    loadTender();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.description || !form.startDate || !form.endDate) {
      setError('Name, description, start date, and end date are required');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      startBidPrice: form.startBidPrice === '' ? undefined : Number(form.startBidPrice),
      maxBidPrice: form.maxBidPrice === '' ? undefined : Number(form.maxBidPrice),
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      invitedEmails: form.invitedEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean),
      status: form.status
    };

    try {
      setLoading(true);
      if (isEdit) {
        await apiClient.put(`/admin/tenders/${id}`, payload);
      } else {
        await apiClient.post('/admin/tenders', payload);
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tender');
    } finally {
      setLoading(false);
    }
  };

  const disableEditing = initialStartDate && new Date() >= initialStartDate;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">
        {isEdit ? 'Edit Tender' : 'Create Tender'}
      </h1>
      {error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg shadow-sm p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={disableEditing}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            disabled={disableEditing}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Bid Price (optional)
            </label>
            <input
              type="number"
              name="startBidPrice"
              value={form.startBidPrice}
              onChange={handleChange}
              disabled={disableEditing}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Bid Price (optional)
            </label>
            <input
              type="number"
              name="maxBidPrice"
              value={form.maxBidPrice}
              onChange={handleChange}
              disabled={disableEditing}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="datetime-local"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              disabled={disableEditing}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="datetime-local"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              disabled={disableEditing}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invited Emails (comma separated)
          </label>
          <textarea
            name="invitedEmails"
            value={form.invitedEmails}
            onChange={handleChange}
            disabled={disableEditing}
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            disabled={disableEditing}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Publishing will send email invitations to all invited bidders.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-4 py-2 rounded-md border text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || disableEditing}
            className="px-4 py-2 rounded-md bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenderFormPage;


