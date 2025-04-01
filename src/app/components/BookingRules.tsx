import React from 'react';

interface BookingRulesProps {
  isAuthenticated: boolean;
  userQuota: number;
  currentWeekQuota: number;
  nextWeekQuota: number;
}

const BookingRules: React.FC<BookingRulesProps> = ({ 
  isAuthenticated, 
  userQuota, 
  currentWeekQuota, 
  nextWeekQuota 
}) => {
  return (
    <div className="mb-4 bg-blue-50 p-3 sm:p-4 border-l-4 border-blue-500 rounded">
      <p className="text-blue-800 text-sm">
        <strong>Booking Rules:</strong> You can book any date from tomorrow until 7 days from today. Weekly quotas are calculated from Sunday to Saturday.
        {isAuthenticated && (
          <>
            <br />
            <strong>This week's usage:</strong> You have used {currentWeekQuota} of your {userQuota} hour weekly quota (current week).
            <br />
            <strong>Next week's usage:</strong> You have used {nextWeekQuota} of your {userQuota} hour weekly quota (upcoming week).
          </>
        )}
        {!isAuthenticated && (
          <> All members receive a standard quota of 3 hours per week for bookings.</>
        )}
      </p>
    </div>
  );
};

export default BookingRules;