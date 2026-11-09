import React, { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

interface LiveClockProps {
  showDate?: boolean;
  className?: string;
  iconClassName?: string;
}

export const LiveClock = memo(function LiveClock({
  showDate = true,
  className = "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-200 border border-purple-400/20 text-xs font-semibold backdrop-blur-xs",
  iconClassName = "w-3.5 h-3.5 text-amber-400 animate-pulse"
}: LiveClockProps) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={className}>
      <Clock className={iconClassName} />
      <span>
        {showDate ? format(time, 'EEE, dd MMM yyyy • hh:mm:ss a') : format(time, 'hh:mm:ss a')}
      </span>
    </div>
  );
});

export default LiveClock;
