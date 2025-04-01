import React from 'react';
import { format, addDays } from 'date-fns';
import BookingRules from './BookingRules';
import TimeSlotSelector from './TimeSlotSelector';
import BookingWindowClosed from './BookingWindowClosed';
import { TIMEZONE } from '../types/types';

interface BookingFormProps {
  isBookingWindowOpen: boolean;
  isAuthenticated: boolean;
  bookingDate: string;
  setBookingDate: (date: string) => void;
  selectedDuration: 1 | 2;
  setSelectedDuration: (duration: 1 | 2) => void;
  availableTimeSlots: any[];
  selectedTimeSlots: any[];
  addTimeSlot: (slot: any) => void;
  removeTimeSlot: (slotId: string) => void;
  userQuota: number;
  currentWeekQuota: number;
  nextWeekQuota: number;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
  handleBookingSubmit: (e: React.FormEvent) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  isBookingWindowOpen,
  isAuthenticated,
  bookingDate,
  setBookingDate,
  selectedDuration,
  setSelectedDuration,
  availableTimeSlots,
  selectedTimeSlots,
  addTimeSlot,
  removeTimeSlot,
  userQuota,
  currentWeekQuota,
  nextWeekQuota,
  isSubmitting,
  errorMessage,
  successMessage,
  handleBookingSubmit
}) => {
  // Calculate booking window times for display
  const getBookingWindowTimes = () => {
    return {
      openTime: '6:00 pm',
      closeTime: '11:59 pm'
    };
  };

  // Get min and max dates for booking
  const getDateLimits = () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);
    
    return {
      minDate: format(tomorrow, 'yyyy-MM-dd'),
      maxDate: format(nextWeek, 'yyyy-MM-dd')
    };
  };

  const { openTime, closeTime } = getBookingWindowTimes();
  const { minDate, maxDate } = getDateLimits();

  return (
    <div className="mt-8 bg-white p-3 sm:p-6 border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Book Court</h2>
      
      {isBookingWindowOpen ? (
        <>
          <BookingRules 
            isAuthenticated={isAuthenticated}
            userQuota={userQuota}
            currentWeekQuota={currentWeekQuota}
            nextWeekQuota={nextWeekQuota}
          />
          
          {!isAuthenticated && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded">
              <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">Tennis Booking Quota System</h3>
              <p className="text-gray-700 mb-2 text-sm">
                New members automatically receive a 3-hour weekly booking quota. 
                You'll need to sign in to complete your booking, but you can browse available slots now.
              </p>
              <p className="text-gray-700 text-sm">
                Your selections will be saved when you sign in during the booking process.
              </p>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {errorMessage}
            </div>
          )}
          
          <form onSubmit={handleBookingSubmit}>
            <div className="responsive-grid">
              <div>
                <label htmlFor="bookingDate" className="block text-sm font-medium text-black mb-1">
                  Booking Date
                </label>
                <input
                  type="date"
                  id="bookingDate"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full p-2 border border-gray-300 rounded-md text-black"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Select any date from tomorrow until next {format(new Date(), 'EEEE')}
                </p>
              </div>
              
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Duration
                </label>
                <select
                  id="duration"
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(parseInt(e.target.value) as 1 | 2)}
                  className="w-full p-2 border border-gray-300 rounded-md text-black"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                </select>
              </div>
            </div>
            
            <TimeSlotSelector
              availableTimeSlots={availableTimeSlots}
              selectedTimeSlots={selectedTimeSlots}
              addTimeSlot={addTimeSlot}
              removeTimeSlot={removeTimeSlot}
              userQuota={userQuota}
              nextWeekQuota={nextWeekQuota}
            />
            
            <div className="mt-4 sm:mt-6">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isSubmitting || selectedTimeSlots.length === 0}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <BookingWindowClosed 
          openTime={openTime} 
          closeTime={closeTime} 
          timezone={TIMEZONE} 
        />
      )}
    </div>
  );
};

export default BookingForm;