import React from 'react';
import { TimeSlotSelectorProps } from '../types/types';
import AvailableTimeSlots from './AvailableTimeSlots';
import SelectedTimeSlots from './SelectedTimeSlots';

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  availableTimeSlots,
  selectedTimeSlots,
  addTimeSlot,
  removeTimeSlot,
  userQuota,
  nextWeekQuota
}) => {
  return (
    <div className="mt-4 sm:mt-6 responsive-grid">
      <div>
        <AvailableTimeSlots 
          availableTimeSlots={availableTimeSlots} 
          addTimeSlot={addTimeSlot} 
        />
      </div>
      
      <div>
        <SelectedTimeSlots 
          selectedTimeSlots={selectedTimeSlots} 
          removeTimeSlot={removeTimeSlot}
          userQuota={userQuota}
          nextWeekQuota={nextWeekQuota}
        />
      </div>
    </div>
  );
};

export default TimeSlotSelector;