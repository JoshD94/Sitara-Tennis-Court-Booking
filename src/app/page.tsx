'use client';

import React, { useState, useEffect } from 'react';
import { toZonedTime } from 'date-fns-tz';
import { format as formatDate, addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Booking, 
  TimeSlot, 
  TIMEZONE,
  CalendarEvent
} from './types/types';

// Import components
import LoadingSpinner from './components/LoadingSpinner';
import Header from './components/Header';
import BookingCalendar from './components/BookingCalendar';
import CalendarLegend from './components/CalendarLegend';
import UpcomingBookings from './components/UpcomingBookings';
import BookingForm from './components/BookingForm';
import AuthModal from './components/AuthModal';

export default function Home() {
  const { user, isAuthenticated, token, logout } = useAuth();
  const [allBookings, setBookings] = useState<Booking[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
  // For new booking form
  const [bookingDate, setBookingDate] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<1 | 2>(1); // 1 or 2 hours
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userQuota, setUserQuota] = useState(3); // Default quota
  // eslint-disable-next-line
  const [usedQuota, setUsedQuota] = useState(0);
  const [isBookingWindowOpen, setIsBookingWindowOpen] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  
  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Calculate current week and next week's quotas
  const [currentWeekQuota, setCurrentWeekQuota] = useState(0);
  const [nextWeekQuota, setNextWeekQuota] = useState(0);

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
    // Clear error and success messages
    setErrorMessage('');
    setSuccessMessage('');
    
    // Clear selected time slots
    setSelectedTimeSlots([]);
    
    // The rest of your auth state change handling remains the same
    if (isAuthenticated && user) {
      setIsLoading(true);
      fetchUserBookings().finally(() => setIsLoading(false));
    } else {
      setUserBookings([]);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    setIsLoading(true);
    fetchAllBookings().finally(() => {
      // Set tomorrow as the default selected date
      const tomorrow = addDays(new Date(), 1);
      const tomorrowFormatted = formatDate(tomorrow, 'yyyy-MM-dd');
      
      console.log("Setting default booking date to tomorrow:", tomorrowFormatted);
      setBookingDate(tomorrowFormatted);
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
    const events: CalendarEvent[] = [];
    
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
    
    // Create date object for the selected date using the app's timezone
    const dateOnly = bookingDate.split('T')[0]; // Ensure we just have YYYY-MM-DD
    
    // Parse the date in the correct timezone
    const selectedDate = new Date(`${dateOnly}T12:00:00`);
    
    // Check if selected date is valid for booking (between tomorrow and next week)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    
    if (selectedDate < tomorrow || selectedDate > nextWeek) {
      console.log("Selected date is outside the valid booking range");
      setAvailableTimeSlots([]);
      return;
    }
    
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
      
      // Also check overlap with already selected time slots for the same date
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

  // Add time slot to selected list
  const addTimeSlot = (slot: TimeSlot) => {
    // Determine which week this slot belongs to
    const slotDate = new Date(slot.startTime);
    const today = new Date();
    
    // Calculate start of current week (Sunday)
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Calculate start of next week
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);
    
    // Calculate end of next week
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
    nextWeekEnd.setHours(0, 0, 0, 0);
    
    // Check if slot is in current week or next week
    const isCurrentWeek = slotDate >= currentWeekStart && slotDate < nextWeekStart;
    const isNextWeek = slotDate >= nextWeekStart && slotDate < nextWeekEnd;
    
    // Get existing selected slots for the relevant week
    const existingCurrentWeekSlots = selectedTimeSlots.filter(s => {
      const date = new Date(s.startTime);
      return date >= currentWeekStart && date < nextWeekStart;
    });
    
    const existingNextWeekSlots = selectedTimeSlots.filter(s => {
      const date = new Date(s.startTime);
      return date >= nextWeekStart && date < nextWeekEnd;
    });
    
    // Calculate hours already selected
    const currentWeekSelected = existingCurrentWeekSlots.reduce((acc, s) => acc + s.duration, 0);
    const nextWeekSelected = existingNextWeekSlots.reduce((acc, s) => acc + s.duration, 0);
    
    // Check if adding this slot would exceed the quota for the relevant week
    if (isCurrentWeek) {
      if (currentWeekQuota + currentWeekSelected + slot.duration > userQuota) {
        setErrorMessage(`Adding this slot would exceed your weekly quota of ${userQuota} hours for the current week.`);
        return;
      }
    } else if (isNextWeek) {
      if (nextWeekQuota + nextWeekSelected + slot.duration > userQuota) {
        setErrorMessage(`Adding this slot would exceed your weekly quota of ${userQuota} hours for next week.`);
        return;
      }
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

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setBookingDate(newDate);
    // Clear selected time slots when changing dates
    setSelectedTimeSlots([]);
  };

  return (
    <div className="px-3 pt-0 sm:px-6 sm:pt-0 bg-white">
      {isLoading && <LoadingSpinner />}
      
      <Header 
        user={user} 
        isAuthenticated={isAuthenticated} 
        logout={logout} 
        openAuthModal={() => setIsAuthModalOpen(true)} 
      />
      
      <BookingCalendar calendarEvents={calendarEvents} />
      
      <CalendarLegend />
      
      <UpcomingBookings 
        isAuthenticated={isAuthenticated} 
        upcomingBookings={upcomingBookings} 
      />
      
      <BookingForm 
        isBookingWindowOpen={isBookingWindowOpen}
        isAuthenticated={isAuthenticated}
        bookingDate={bookingDate}
        setBookingDate={handleDateChange}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        availableTimeSlots={availableTimeSlots}
        selectedTimeSlots={selectedTimeSlots}
        addTimeSlot={addTimeSlot}
        removeTimeSlot={removeTimeSlot}
        userQuota={userQuota}
        currentWeekQuota={currentWeekQuota}
        nextWeekQuota={nextWeekQuota}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        successMessage={successMessage}
        handleBookingSubmit={handleBookingSubmit}
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}