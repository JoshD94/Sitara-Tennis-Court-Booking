import React from 'react';
import { HeaderProps } from '../types/types';

const Header: React.FC<HeaderProps> = ({ user, isAuthenticated, logout, openAuthModal }) => {
  // Enhanced logout handler
  const handleLogout = () => {
    logout();
    // Reload page to reset all state
    window.location.reload();
  };

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 bg-blue-100 py-3 px-3 sm:px-6 -mx-3 sm:-mx-6 border-l-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Sitara Sports Club Tennis Court Booking</h1>
      
      {isAuthenticated && user ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto gap-2">
          <span className="text-gray-600 text-sm sm:text-base sm:mr-4">
            Signed in as: <span className="font-medium">{user.email}</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm w-full sm:w-auto"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={openAuthModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto"
        >
          Sign In
        </button>
      )}
    </header>
  );
};

export default Header;