'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Parse the response data first
      const result = await login(email, password);
      
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed');
        return;
      }
      
      // Set isNewUser to the value from result, or false if undefined
      setIsNewUser(result.isNewUser ?? false);
      
      // Don't close modal yet for new users so they can see the message
      if (!result.isNewUser) {
        // For returning users, close modal and reload page
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle continuation after new user creation
  const handleContinue = () => {
    onClose();
    // Reload the page to reset all state
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-black">
          {isNewUser === null ? 'Sign In to Sitara Tennis Booking' : 
           isNewUser ? 'Account Created' : 'Welcome Back'}
        </h2>
        
        {isNewUser === true && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <p>Your account has been created successfully!</p>
            <p className="font-bold mt-2">Please remember your password for future bookings.</p>
          </div>
        )}
        
        {isNewUser !== true && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-black"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 text-black rounded-md"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                If this is your first time, a new account will be created with this email.
              </p>
            </div>
            
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errorMessage}
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
        
        {isNewUser === true && (
          <div className="mt-4 text-center">
            <button
              onClick={handleContinue}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continue to Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}