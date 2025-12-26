import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
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
  const [success, setSuccess] = useState('');
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
    setSuccess('');

    // Validation
    if (!form.name.trim() || !form.description.trim() || !form.startDate || !form.endDate || !form.startBidPrice || !form.maxBidPrice || !form.invitedEmails.trim()) {
      setError('All fields are required.');
      return;
    }

    // Validate bid prices
    const startBid = Number(form.startBidPrice);
    const maxBid = Number(form.maxBidPrice);
    if (isNaN(startBid) || isNaN(maxBid) || startBid < 0 || maxBid < 0) {
      setError('Bid prices must be valid positive numbers.');
      return;
    }
    if (startBid > maxBid) {
      setError('Start Bid Price must be less than or equal to Max Bid Price.');
      return;
    }

    // Validate date logic
    const startDate = dayjs(form.startDate);
    const endDate = dayjs(form.endDate);
    if (!startDate.isValid() || !endDate.isValid()) {
      setError('Please provide valid start and end dates.');
      return;
    }
    if (endDate.isBefore(startDate)) {
      setError('End Date must be after Start Date.');
      return;
    }

    // Validate emails
    const emails = form.invitedEmails.split(',').map(e => e.trim()).filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emails.length === 0 || !emails.every(email => emailRegex.test(email))) {
      setError('Please provide valid email addresses, separated by commas.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      startBidPrice: startBid,
      maxBidPrice: maxBid,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      invitedEmails: emails,
      status: form.status
    };

    try {
      setLoading(true);
      if (isEdit) {
        await apiClient.put(`/admin/tenders/${id}`, payload);
      } else {
        await apiClient.post('/admin/tenders', payload);
      }
      setSuccess('Tender saved successfully!');
      setTimeout(() => navigate('/admin'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tender');
    } finally {
      setLoading(false);
    }
  };

  // const disableEditing = initialStartDate && new Date() >= initialStartDate;
 const disableEditing = false
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
      {success && (
        <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
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
            placeholder="Enter tender name"
            className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            placeholder="Enter tender description"
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Bid Price
            </label>
            <input
              type="number"
              name="startBidPrice"
              value={form.startBidPrice}
              onChange={handleChange}
              disabled={disableEditing}
              placeholder="Enter starting bid price"
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Bid Price
            </label>
            <input
              type="number"
              name="maxBidPrice"
              value={form.maxBidPrice}
              onChange={handleChange}
              disabled={disableEditing}
              placeholder="Enter maximum bid price"
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
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
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            disabled={isEdit}
            placeholder="Enter email addresses separated by commas"
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            disabled={disableEditing}
            className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base font-normal disabled:bg-gray-100 disabled:cursor-not-allowed"
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


