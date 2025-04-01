// types.ts
export interface User {
    id: string;
    email: string;
}

export interface Booking {
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

export interface TimeSlot {
    id: string;
    startTime: Date;
    endTime: Date;
    duration: number;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    isUserBooking: boolean;
}

// Props interfaces for components
export interface LoadingSpinnerProps {
    // No props needed for basic spinner
}

export interface HeaderProps {
    user: User | null;
    isAuthenticated: boolean;
    logout: () => void;
    openAuthModal: () => void;
}

export interface BookingCalendarProps {
    calendarEvents: CalendarEvent[];
}

export interface CalendarLegendProps {
    // No props needed for static legend
}

export interface UpcomingBookingsProps {
    isAuthenticated: boolean;
    upcomingBookings: Booking[];
}

export interface BookingCardProps {
    booking: Booking;
}

export interface BookingRulesProps {
    isAuthenticated: boolean;
    userQuota: number;
    currentWeekQuota: number;
    nextWeekQuota: number;
}

export interface AvailableTimeSlotsProps {
    availableTimeSlots: TimeSlot[];
    addTimeSlot: (slot: TimeSlot) => void;
}

export interface SelectedTimeSlotsProps {
    selectedTimeSlots: TimeSlot[];
    removeTimeSlot: (slotId: string) => void;
    userQuota: number;
    nextWeekQuota: number;
}

export interface TimeSlotSelectorProps {
    availableTimeSlots: TimeSlot[];
    selectedTimeSlots: TimeSlot[];
    addTimeSlot: (slot: TimeSlot) => void;
    removeTimeSlot: (slotId: string) => void;
    userQuota: number;
    nextWeekQuota: number;
}

export interface BookingFormProps {
    isBookingWindowOpen: boolean;
    isAuthenticated: boolean;
    bookingDate: string;
    setBookingDate: (date: string) => void;
    selectedDuration: 1 | 2;
    setSelectedDuration: (duration: 1 | 2) => void;
    availableTimeSlots: TimeSlot[];
    selectedTimeSlots: TimeSlot[];
    addTimeSlot: (slot: TimeSlot) => void;
    removeTimeSlot: (slotId: string) => void;
    userQuota: number;
    currentWeekQuota: number;
    nextWeekQuota: number;
    isSubmitting: boolean;
    errorMessage: string;
    successMessage: string;
    handleBookingSubmit: (e: React.FormEvent) => void;
}

export interface BookingWindowClosedProps {
    openTime: string;
    closeTime: string;
    timezone: string;
}

export interface QuotaDisplayProps {
    selectedTimeSlots: TimeSlot[];
    userQuota: number;
    nextWeekQuota: number;
}

// Utility types
export const TIMEZONE = 'America/New_York';