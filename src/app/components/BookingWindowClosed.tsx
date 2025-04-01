import React from 'react';
import { BookingWindowClosedProps } from '../types/types';

const BookingWindowClosed: React.FC<BookingWindowClosedProps> = ({
  openTime,
  closeTime,
  timezone
}) => {
  return (
    <div className="p-3 sm:p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded">
      <h3 className="text-base sm:text-lg font-medium text-yellow-800 mb-2">Booking Not Available</h3>
      <p className="text-yellow-700 text-sm">
        Booking is only available between {openTime} and {closeTime} {timezone.replace('_', ' ')} Time. 
        Please check back during the booking window.
      </p>
    </div>
  );
};

export default BookingWindowClosed;