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
  const intervalRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Reset time when initialTime changes
  useEffect(() => {
    setTimeRemaining(initialTime);
    lastTickRef.current = Date.now();
  }, [initialTime]);

  // Handle timer ticks
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeRemaining <= 0) {
      onTimeUp();
      return;
    }

    if (!isPaused) {
      lastTickRef.current = Date.now();
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        
        if (delta >= 1) {
          setTimeRemaining(prev => {
            const newTime = Math.max(0, prev - delta);
            onTick(newTime);
            return newTime;
          });
          lastTickRef.current = now;
        }
      }, 100); // Check more frequently for accuracy
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, onTimeUp, onTick, timeRemaining]);

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