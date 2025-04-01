import React from 'react';
import { LoadingSpinnerProps } from '../types/types';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = () => (
  <div className="loading-overlay">
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="text-gray-700 font-medium">Loading...</p>
    </div>
  </div>
);

export default LoadingSpinner;