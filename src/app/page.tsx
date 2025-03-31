'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toZonedTime, format } from 'date-fns-tz';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './components/AuthModal';

// Initialize the localizer for the calendar
const localizer = momentLocalizer(moment);

const TIMEZONE = 'America/New_York';

// Interface for bookings
interface Booking {
  id: string;
  userId: string;
  startTime: string | Date;
  endTime: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    id: string;
    email: string;
  };
}

// Interface for time slots
interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="loading-overlay">
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="text-gray-700 font-medium">Loading...</p>
    </div>
  </div>
);

export default function Home() {
  const { user, isAuthenticated, token, logout } = useAuth();
  const [allBookings, setBookings] = useState<Booking[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  
  // For new booking form
  const [bookingDate, setBookingDate] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<1 | 2>(1); // 1 or 2 hours
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userQuota, setUserQuota] = useState(3); // Default quota
  const [usedQuota, setUsedQuota] = useState(0);
  const [isBookingWindowOpen, setIsBookingWindowOpen] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  
  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Add fetch function with authentication
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    return fetch(url, options);
  };

  useEffect(() => {
    // Check if current time is between 6pm and 11:59pm in the specified timezone
    const checkBookingWindow = () => {
      const nowUTC = new Date();
      const now = toZonedTime(nowUTC, TIMEZONE);
      
      const openTime = new Date(now);
      openTime.setHours(18, 0, 0, 0); // 6pm in specified timezone
      
      const closeTime = new Date(now);
      closeTime.setHours(23, 59, 59, 999); // 11:59pm in specified timezone
      
      // For testing, uncomment this line and comment out the check below
      setIsBookingWindowOpen(true);
      
      // Actual time window check - uncomment when needed
      // setIsBookingWindowOpen(now >= openTime && now <= closeTime);
    };
    
    // Check initially
    checkBookingWindow();
    
    // Check every minute
    const intervalId = setInterval(checkBookingWindow, 60000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchAllBookings().finally(() => {
      // Set the next week same day as the default booking date
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      setBookingDate(nextWeek.toISOString().split('T')[0]);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !userBookings.length) {
      setUpcomingBookings([]);
      return;
    }
  
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Filter bookings that are today or in the future
    const upcoming = userBookings.filter(booking => {
      const bookingStart = new Date(booking.startTime);
      return bookingStart >= today;
    });
    
    // Sort by date (earliest first)
    upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    setUpcomingBookings(upcoming);
    
  }, [user, userBookings]);
  
  // Fetch user bookings when authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      fetchUserBookings().finally(() => setIsLoading(false));
    } else {
      setUserBookings([]);
    }
  }, [isAuthenticated, user]);

  const fetchAllBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings", error);
    }
  };
  
  const fetchUserBookings = async () => {
    if (!user) return;
    
    try {
      const response = await fetchWithAuth(`/api/users/${user.id}`);
      const data = await response.json();
      if (data && data.bookings) {
        setUserBookings(data.bookings);
        
        // Calculate used quota
        let hoursUsed = 0;
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Move to Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7); // Move to next Sunday
        
        for (const booking of data.bookings) {
          const bookingStart = new Date(booking.startTime);
          if (bookingStart >= startOfWeek && bookingStart < endOfWeek) {
            const bookingEnd = new Date(booking.endTime);
            const hours = (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60);
            hoursUsed += hours;
          }
        }
        
        setUsedQuota(hoursUsed);
        
        // Set user quota if available in the data
        if (data.bookingQuota) {
          setUserQuota(data.bookingQuota);
        }
      }
    } catch (error) {
      console.error("Error fetching user bookings", error);
    }
  };
  
  // Process bookings for calendar when data changes
  useEffect(() => {
    const events: any[] = [];
    
    // Add all bookings to calendar with compact formatting
    allBookings.forEach(booking => {
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);
      
      // Get hours for compact display
      const startHour = startTime.getHours();
      const endHour = endTime.getHours();
      
      // Get AM/PM designation
      const startAmPm = startHour >= 12 ? 'pm' : 'am';
      const endAmPm = endHour >= 12 ? 'pm' : 'am';
      
      // Convert to 12-hour format
      const start12Hour = startHour % 12 || 12;
      const end12Hour = endHour % 12 || 12;
      
      // Create compact format (6-7pm)
      const timeDisplay = `${start12Hour}-${end12Hour}${endAmPm}`;
      
      // For events spanning across AM/PM boundary, include both designations
      const compactTimeDisplay = startAmPm !== endAmPm 
        ? `${start12Hour}${startAmPm}-${end12Hour}${endAmPm}` 
        : `${start12Hour}-${end12Hour}${endAmPm}`;
      
      events.push({
        id: booking.id,
        title: `${compactTimeDisplay}`,
        start: startTime,
        end: endTime,
        isUserBooking: booking.userId === user?.id
      });
    });
    
    setCalendarEvents(events);
  }, [allBookings, user]);

  // Calculate current week and next week's quotas
  const [currentWeekQuota, setCurrentWeekQuota] = useState(0);
  const [nextWeekQuota, setNextWeekQuota] = useState(0);

  useEffect(() => {
    if (!user || !userBookings.length) {
      setCurrentWeekQuota(0);
      setNextWeekQuota(0);
      return;
    }

    const today = new Date();
    
    // Current week (Sunday to Saturday)
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Move to Sunday
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 7); // Next Sunday
    currentWeekEnd.setHours(0, 0, 0, 0);
    
    // Next week (Sunday to Saturday)
    const nextWeekStart = new Date(currentWeekEnd);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
    
    // Calculate quota used for current week
    let currentWeekUsed = 0;
    let nextWeekUsed = 0;
    
    for (const booking of userBookings) {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      const hours = (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60);
      
      if (bookingStart >= currentWeekStart && bookingStart < currentWeekEnd) {
        currentWeekUsed += hours;
      } else if (bookingStart >= nextWeekStart && bookingStart < nextWeekEnd) {
        nextWeekUsed += hours;
      }
    }
    
    setCurrentWeekQuota(currentWeekUsed);
    setNextWeekQuota(nextWeekUsed);
    
  }, [user, userBookings]);

  // Generate available time slots when date changes
  useEffect(() => {
    if (!bookingDate) return;
    
    generateAvailableTimeSlots();
  }, [bookingDate, allBookings, selectedDuration, selectedTimeSlots]);

  const generateAvailableTimeSlots = () => {
    if (!bookingDate) return;
    
    // Create date object for the selected date
    const selectedDate = new Date(bookingDate);
    
    // Generate all possible time slots from 6am to 9pm (last slot at 8pm)
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour < 21 - (selectedDuration - 1); hour++) {
      const startTime = new Date(selectedDate);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(hour + selectedDuration, 0, 0, 0);
      
      // Check if this slot overlaps with any existing booking
      let isAvailable = true;
      for (const booking of allBookings) {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        
        // Only check bookings on the same date
        if (bookingStart.toDateString() !== selectedDate.toDateString()) continue;
        
        // Check for overlap
        if (
          (startTime >= bookingStart && startTime < bookingEnd) ||
          (endTime > bookingStart && endTime <= bookingEnd) ||
          (startTime <= bookingStart && endTime >= bookingEnd)
        ) {
          isAvailable = false;
          break;
        }
      }
      
      // Also check overlap with already selected time slots
      for (const selected of selectedTimeSlots) {
        // Skip if selected slot is for a different date
        if (selected.startTime.toDateString() !== selectedDate.toDateString()) continue;
        
        if (
          (startTime >= selected.startTime && startTime < selected.endTime) ||
          (endTime > selected.startTime && endTime <= selected.endTime) ||
          (startTime <= selected.startTime && endTime >= selected.endTime)
        ) {
          isAvailable = false;
          break;
        }
      }
      
      if (isAvailable) {
        slots.push({
          id: `${startTime.toISOString()}-${endTime.toISOString()}`,
          startTime,
          endTime,
          duration: selectedDuration
        });
      }
    }
    
    setAvailableTimeSlots(slots);
  };

  // Custom event styling
  const eventStyleGetter = (event: any) => {
    let style = {
      backgroundColor: '#e6f2ff', // light blue for all bookings
      color: '#0066cc',
      border: '1px solid #99ccff',
      borderRadius: '4px',
      display: 'block'
    };
    
    if (event.isUserBooking) {
      style.backgroundColor = '#d4edda'; // light green for user bookings
      style.color = '#155724';
      style.border = '1px solid #c3e6cb';
    }
    
    return {
      style
    };
  };
  
  // Custom calendar styling
  const calendarStyles = {
    height: 500,
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  };

  // Add time slot to selected list
  const addTimeSlot = (slot: TimeSlot) => {
    // Check if adding this slot would exceed the quota
    const currentUsage = nextWeekQuota + selectedTimeSlots.reduce((acc, s) => acc + s.duration, 0);
    if (currentUsage + slot.duration > userQuota) {
      setErrorMessage(`Adding this slot would exceed your weekly quota of ${userQuota} hours for next week.`);
      return;
    }
    
    setSelectedTimeSlots([...selectedTimeSlots, slot]);
    setErrorMessage('');
  };

  // Remove time slot from selected list
  const removeTimeSlot = (slotId: string) => {
    setSelectedTimeSlots(selectedTimeSlots.filter(slot => slot.id !== slotId));
  };

  // Handle form submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTimeSlots.length === 0) {
      setErrorMessage('Please select at least one time slot');
      return;
    }
    
    // Show auth modal if not authenticated
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    // User is authenticated, proceed with booking
    submitBooking();
  };
  
  const submitBooking = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Prepare booking data
      const bookingSlots = selectedTimeSlots.map(slot => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString()
      }));
      
      const response = await fetchWithAuth('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingSlots })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      // Clear selected slots
      setSelectedTimeSlots([]);
      setSuccessMessage('Bookings created successfully!');
      
      // Refresh bookings lists
      fetchAllBookings();
      fetchUserBookings();
      
    } catch (error) {
      console.error('Error creating booking:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Calculate booking window times for display
  const getBookingWindowTimes = () => {
    const now = new Date();
    const zonedNow = toZonedTime(now, TIMEZONE);
    
    const openTime = new Date(zonedNow);
    openTime.setHours(18, 0, 0, 0); // 6pm in specified timezone
    
    const closeTime = new Date(zonedNow);
    closeTime.setHours(23, 59, 59, 999); // 11:59pm in specified timezone
    
    return {
      openTime: format(openTime, 'h:mm a', { timeZone: TIMEZONE }),
      closeTime: format(closeTime, 'h:mm a', { timeZone: TIMEZONE })
    };
  };

  const { openTime, closeTime } = getBookingWindowTimes();

  return (
    <div className="px-3 pt-0 sm:px-6 sm:pt-0 bg-white">
      {isLoading && <LoadingSpinner />}
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 bg-blue-100 py-3 px-3 sm:px-6 -mx-3 sm:-mx-6 border-l-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Sitara Sports Club Tennis Court Booking</h1>
        
        {isAuthenticated && user ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto gap-2">
            <span className="text-gray-600 text-sm sm:text-base sm:mr-4">
              Signed in as: <span className="font-medium">{user.email}</span>
            </span>
            <button
              onClick={logout}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm w-full sm:w-auto"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto"
          >
            Sign In
          </button>
        )}
      </header>
      
      <div className="mb-8 overflow-hidden" style={calendarStyles}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
          className="light-theme-calendar"
          toolbar={true}
          components={{
            toolbar: props => (
              <div className="rbc-toolbar">
                <span className="rbc-btn-group">
                  <button type="button" onClick={() => props.onNavigate('PREV')}>← Prev</button>
                  <button type="button" onClick={() => props.onNavigate('TODAY')}>Today</button>
                  <button type="button" onClick={() => props.onNavigate('NEXT')}>Next →</button>
                </span>
                <span className="rbc-toolbar-label">{props.label}</span>
                <span className="rbc-btn-group rbc-hidden sm:rbc-visible">
                  <button type="button" onClick={() => props.onView('month')}>Month</button>
                  <button type="button" onClick={() => props.onView('week')}>Week</button>
                  <button type="button" onClick={() => props.onView('day')}>Day</button>
                </span>
              </div>
            ),
          }}
        />
      </div>
      
      <div className="flex flex-wrap items-center mb-6 gap-4">
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 bg-blue-100 border border-blue-300 mr-2 rounded"></span>
          <span className="mr-6 text-gray-700 text-sm">All Bookings</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 bg-green-100 border border-green-300 mr-2 rounded"></span>
          <span className="text-gray-700 text-sm">Your Bookings</span>
        </div>
      </div>
      
      <h2 className="text-xl sm:text-2xl font-bold mt-8 mb-4 text-gray-800">Your Upcoming Bookings</h2>
      {!isAuthenticated ? (
        <p className="text-gray-600">Please sign in to view your bookings.</p>
      ) : upcomingBookings.length === 0 ? (
        <p className="text-gray-600">You have no upcoming bookings.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {upcomingBookings.map((booking) => {
            const bookingDate = new Date(booking.startTime);
            const isToday = bookingDate.toDateString() === new Date().toDateString();
            
            return (
              <li key={booking.id} className={`py-3 bg-white border border-gray-200 rounded-lg mb-3 p-3 sm:p-4 shadow-sm ${isToday ? 'border-l-4 border-l-blue-500' : ''}`}>
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
                    <p className="text-gray-600 text-sm">Time: {formatTime(new Date(booking.startTime))} - {formatTime(new Date(booking.endTime))}</p>
                  </div>
                  <div className="mt-2 md:mt-0 text-right">
                    <p className="text-gray-500 text-xs">Created: {new Date(booking.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      
      {/* New Booking Form - Only show if booking window is open */}
      <div className="mt-8 bg-white p-3 sm:p-6 border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Book Next Week</h2>
        
        {isBookingWindowOpen ? (
          <>
            <div className="mb-4 bg-blue-50 p-3 sm:p-4 border-l-4 border-blue-500 rounded">
              <p className="text-blue-800 text-sm">
                <strong>Booking Rules:</strong> Bookings can only be made for next week on the same day as today. Each week is Sunday to Saturday.
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
                    Booking Date (Next Week Same Day)
                  </label>
                  <input
                    type="date"
                    id="bookingDate"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-black"
                    disabled
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Booking is only available for next {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
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
              
              <div className="mt-4 sm:mt-6 responsive-grid">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Available Time Slots</h3>
                  
                  {availableTimeSlots.length === 0 ? (
                    <p className="text-gray-500 text-sm">No available time slots for selected date and duration.</p>
                  ) : (
                    <div className="max-h-48 sm:max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                      <ul className="divide-y divide-gray-200">
                        {availableTimeSlots.map((slot) => (
                          <li key={slot.id} className="py-2 flex justify-between items-center">
                            <span className="text-black text-sm">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                            <button
                              type="button"
                              onClick={() => addTimeSlot(slot)}
                              className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-xs sm:text-sm"
                            >
                              Add
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Selected Time Slots</h3>
                  
                  {selectedTimeSlots.length === 0 ? (
                    <p className="text-black text-sm">No time slots selected yet.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-md p-2">
                      <ul className="divide-y divide-gray-200">
                        {selectedTimeSlots.map((slot) => (
                          <li key={slot.id} className="py-2 flex justify-between items-center">
                            <span className="text-gray-700 text-sm">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeTimeSlot(slot.id)}
                              className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-xs sm:text-sm"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-gray-700 text-sm">
                          Selected for Next Week: {selectedTimeSlots.reduce((total, slot) => total + slot.duration, 0)} hours
                          <br />
                          Next Week's Remaining Quota: {userQuota - nextWeekQuota} hours
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={isSubmitting || selectedTimeSlots.length === 0}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-3 sm:p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <h3 className="text-base sm:text-lg font-medium text-yellow-800 mb-2">Booking Not Available</h3>
            <p className="text-yellow-700 text-sm">
              Booking is only available between {openTime} and {closeTime} {TIMEZONE.replace('_', ' ')} Time. Please check back during the booking window.
            </p>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      
      {/* Auth Modal */}
    </div>
  );
}