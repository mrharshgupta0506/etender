import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-indigo-600">
            E-Tender Platform
          </Link>
          {user ? (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                {user.email} ({user.role})
              </span>
              <Link
                to="/change-password"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Change Password
              </Link>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-md border text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Login
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
};

export default Layout;


