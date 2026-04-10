import React, { useState, useEffect } from 'react';
import { calculateTimeLeft } from '../utils/dateUtils.js';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <div className="countdown expired">
        Deadline Passed
        <style>{`
          .countdown.expired {
            color: var(--danger);
            font-weight: 600;
            font-size: 0.875rem;
            text-align: center;
            background: rgba(239, 68, 68, 0.1);
            padding: 0.5rem;
            border-radius: var(--radius-sm);
            width: 100%;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="countdown">
      <div className="time-block">
        <span className="time-val">{timeLeft.days}</span>
        <span className="time-label">Days</span>
      </div>
      <span className="separator">:</span>
      <div className="time-block">
        <span className="time-val">{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="time-label">Hrs</span>
      </div>
      <span className="separator">:</span>
      <div className="time-block">
        <span className="time-val">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="time-label">Min</span>
      </div>
      <span className="separator">:</span>
      <div className="time-block">
        <span className="time-val accent">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span className="time-label">Sec</span>
      </div>

      <style>{`
        .countdown {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(15, 23, 42, 0.4);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          width: 100%;
        }
        .time-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 2.5rem;
        }
        .time-val {
          font-variant-numeric: tabular-nums;
          font-weight: 700;
          font-size: 1.125rem;
          color: var(--text-primary);
        }
        .time-val.accent {
          color: var(--accent-primary);
        }
        .time-label {
          font-size: 0.65rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.125rem;
        }
        .separator {
          color: var(--text-secondary);
          font-weight: 700;
          margin-bottom: 0.75rem;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};

export default CountdownTimer;
