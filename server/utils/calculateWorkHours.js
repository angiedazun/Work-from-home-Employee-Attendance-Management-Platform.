// Calculate work hours between check-in and check-out
const calculateWorkHours = (checkInTime, checkOutTime, breakMinutes = 0) => {
  if (!checkInTime || !checkOutTime) {
    return 0;
  }

  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);

  // Calculate difference in milliseconds
  const diffMs = checkOut - checkIn;
  
  // Convert to hours and subtract break time
  const hours = (diffMs / (1000 * 60 * 60)) - (breakMinutes / 60);
  
  return Math.max(0, parseFloat(hours.toFixed(2)));
};

// Check if employee is late
const isLate = (checkInTime, workStartTime) => {
  const checkIn = new Date(checkInTime);
  const [hours, minutes] = workStartTime.split(':');
  
  const scheduledStart = new Date(checkIn);
  scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const lateThreshold = parseInt(process.env.LATE_THRESHOLD_MINUTES) || 15;
  scheduledStart.setMinutes(scheduledStart.getMinutes() + lateThreshold);
  
  return checkIn > scheduledStart;
};

// Calculate late minutes
const calculateLateMinutes = (checkInTime, workStartTime) => {
  const checkIn = new Date(checkInTime);
  const [hours, minutes] = workStartTime.split(':');
  
  const scheduledStart = new Date(checkIn);
  scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (checkIn <= scheduledStart) {
    return 0;
  }
  
  const diffMs = checkIn - scheduledStart;
  return Math.floor(diffMs / (1000 * 60));
};

// Check if early checkout
const isEarlyCheckout = (checkOutTime, workEndTime) => {
  const checkOut = new Date(checkOutTime);
  const [hours, minutes] = workEndTime.split(':');
  
  const scheduledEnd = new Date(checkOut);
  scheduledEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return checkOut < scheduledEnd;
};

// Calculate early minutes
const calculateEarlyMinutes = (checkOutTime, workEndTime) => {
  const checkOut = new Date(checkOutTime);
  const [hours, minutes] = workEndTime.split(':');
  
  const scheduledEnd = new Date(checkOut);
  scheduledEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (checkOut >= scheduledEnd) {
    return 0;
  }
  
  const diffMs = scheduledEnd - checkOut;
  return Math.floor(diffMs / (1000 * 60));
};

module.exports = {
  calculateWorkHours,
  isLate,
  calculateLateMinutes,
  isEarlyCheckout,
  calculateEarlyMinutes
};
