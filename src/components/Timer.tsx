import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Pause, Play } from 'lucide-react';

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

  useEffect(() => {
    setTimeRemaining(initialTime);
  }, [initialTime]);

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
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          onTick(newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, onTimeUp, onTick, timeRemaining]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);

  return (
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
  );
};

export default Timer;