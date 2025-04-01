import React from 'react';
import { AvailableTimeSlotsProps } from '../types/types';
import { formatTime } from './TimeDisplay';

const AvailableTimeSlots: React.FC<AvailableTimeSlotsProps> = ({ 
  availableTimeSlots, 
  addTimeSlot 
}) => {
  return (
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
  );
};

export default AvailableTimeSlots;