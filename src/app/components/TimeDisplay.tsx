// TimeDisplay.tsx
import React from 'react';

interface TimeDisplayProps {
  date: Date;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ date }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  return <span>{formatTime(date)}</span>;
};

// Export both the component and the utility function
export default TimeDisplay;
export const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};