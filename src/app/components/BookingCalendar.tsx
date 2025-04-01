import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { BookingCalendarProps } from '../types/types';

// Initialize the localizer for the calendar
const localizer = momentLocalizer(moment);

const BookingCalendar: React.FC<BookingCalendarProps> = ({ calendarEvents }) => {
  // Custom event styling
  
  // eslint-disable-next-line
  const eventStyleGetter = (event: any) => {
    const style = {
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

  return (
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
  );
};

export default BookingCalendar;