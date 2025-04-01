import React from 'react';
import { CalendarLegendProps } from '../types/types';

const CalendarLegend: React.FC<CalendarLegendProps> = () => {
  return (
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
  );
};

export default CalendarLegend;