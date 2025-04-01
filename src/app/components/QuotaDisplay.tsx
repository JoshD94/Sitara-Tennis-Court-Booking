import React from "react";
import { QuotaDisplayProps } from "../types/types";

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ 
  selectedTimeSlots, 
  userQuota, 
  nextWeekQuota 
}) => {
  const selectedHours = selectedTimeSlots.reduce((total, slot) => total + slot.duration, 0);
  const remainingQuota = userQuota - nextWeekQuota;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-gray-700 text-sm">
        Selected for Next Week: {selectedHours} hours
        <br />
        Next Week&apos;s Remaining Quota: {remainingQuota} hours
      </p>
    </div>
  );
};

export default QuotaDisplay;