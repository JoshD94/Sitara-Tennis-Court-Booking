import React from 'react';
import { UpcomingBookingsProps } from '../types/types';
import BookingCard from './BookingCard';

const UpcomingBookings: React.FC<UpcomingBookingsProps> = ({ isAuthenticated, upcomingBookings }) => {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mt-8 mb-4 text-gray-800">Your Upcoming Bookings</h2>
      {!isAuthenticated ? (
        <p className="text-gray-600">Please sign in to view your bookings.</p>
      ) : upcomingBookings.length === 0 ? (
        <p className="text-gray-600">You have no upcoming bookings.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {upcomingBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingBookings;