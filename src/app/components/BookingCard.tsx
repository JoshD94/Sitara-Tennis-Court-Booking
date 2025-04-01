import React from 'react';
import { BookingCardProps } from '../types/types';
import { formatTime } from './TimeDisplay';

const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  const bookingDate = new Date(booking.startTime);
  const isToday = bookingDate.toDateString() === new Date().toDateString();
  
  return (
    <li className={`py-3 bg-white border border-gray-200 rounded-lg mb-3 p-3 sm:p-4 shadow-sm ${isToday ? 'border-l-4 border-l-blue-500' : ''}`}>
      <div className="flex flex-col md:flex-row md:justify-between">
        <div>
          {isToday && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
              Today
            </span>
          )}
          <p className="font-medium text-gray-800 text-sm sm:text-base">
            Booking ID: {booking.id.substring(0, 8)}...
          </p>
          <p className="text-gray-600 text-sm">Date: {new Date(booking.startTime).toLocaleDateString()}</p>
          <p className="text-gray-600 text-sm">
            Time: {formatTime(new Date(booking.startTime))} - {formatTime(new Date(booking.endTime))}
          </p>
        </div>
        <div className="mt-2 md:mt-0 text-right">
          <p className="text-gray-500 text-xs">Created: {new Date(booking.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </li>
  );
};

export default BookingCard;