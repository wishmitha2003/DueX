export const calculateTimeLeft = (dateString) => {
  const targetDate = new Date(dateString);
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    expired: false,
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
};

export const formatTimeLeft = (timeLeft) => {
  if (timeLeft.expired) return 'Expired';
  
  const parts = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  if (timeLeft.hours > 0) parts.push(`${timeLeft.hours}h`);
  if (timeLeft.minutes > 0) parts.push(`${timeLeft.minutes}m`);
  
  if (parts.length === 0) return `${timeLeft.seconds}s`;
  
  // Show at most 2 largest units
  return parts.slice(0, 2).join(' ');
};

export const isImminent = (dateString) => {
  const targetDate = new Date(dateString);
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();
  
  // Less than 24 hours
  return difference > 0 && difference <= 24 * 60 * 60 * 1000;
};
