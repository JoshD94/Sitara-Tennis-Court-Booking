import React from 'react';
import { SelectedTimeSlotsProps } from '../types/types';
import { formatTime } from './TimeDisplay';
import QuotaDisplay from './QuotaDisplay';

const SelectedTimeSlots: React.FC<SelectedTimeSlotsProps> = ({ 
  selectedTimeSlots, 
  removeTimeSlot,
  userQuota,
  nextWeekQuota
}) => {
  return (
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
          
          <QuotaDisplay 
            selectedTimeSlots={selectedTimeSlots} 
            userQuota={userQuota} 
            nextWeekQuota={nextWeekQuota} 
          />
        </div>
      )}
    </div>
  );
};

export default SelectedTimeSlots;