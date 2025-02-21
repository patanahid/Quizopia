import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  initialTime: number;
  isPaused: boolean;
  onPauseToggle: () => void;
  onTimeUp: () => void;
  onTick: (newTime: number) => void;
}

const Timer: React.FC<TimerProps> = ({
  initialTime,
  isPaused,
  onPauseToggle,
  onTimeUp,
  onTick,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset time when initialTime changes
  useEffect(() => {
    setTimeRemaining(initialTime);
  }, [initialTime]);

  // Handle timer ticks
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Check if timer should be stopped
    if (timeRemaining <= 0) {
      onTimeUp();
      return;
    }

    // Start timer if not paused
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - 1);
          onTick(newTime);
          return newTime;
        });
      }, 1000);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, onTimeUp, onTick]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(remainingSeconds.toString().padStart(2, '0'));
    
    return parts.join(':');
  };

  const getTimeColor = () => {
    if (timeRemaining <= 60) return 'text-red-500';
    if (timeRemaining <= 300) return 'text-yellow-500';
    return 'text-foreground';
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPauseToggle}
        className="relative h-9 w-9"
      >
        {isPaused ? (
          <Play className="h-4 w-4" />
        ) : (
          <Pause className="h-4 w-4" />
        )}
      </Button>
      <span className={cn(
        "font-mono text-lg font-medium tabular-nums",
        getTimeColor()
      )}>
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
};

export default Timer;