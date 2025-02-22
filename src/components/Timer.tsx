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
  const [time, setTime] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start timer if not paused
    if (!isPaused && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          const newTime = Math.max(0, prev - 1);
          onTick(newTime);
          
          if (newTime === 0) {
            clearInterval(intervalRef.current!);
            onTimeUp();
          }
          
          return newTime;
        });
      }, 1000);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  // Reset when initialTime changes
  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

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
    if (time <= 60) return 'text-red-500';
    if (time <= 300) return 'text-yellow-500';
    return 'text-foreground';
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(formatTime(time));

  const handleStartEdit = () => {
    if (!isPaused) return; // Only allow editing when paused
    setIsEditing(true);
    setEditValue(formatTime(time));
  };

  const handleEditComplete = () => {
    setIsEditing(false);
    // Parse the time string (MM:SS) into seconds
    const parts = editValue.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const newTime = parts[0] * 60 + parts[1];
      if (newTime >= 0) {
        setTime(newTime);
        onTick(newTime);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPauseToggle}
        className="relative h-9 w-9"
        title={isPaused ? "Start Quiz" : "Pause Quiz"}
      >
        {isPaused ? (
          <Play className="h-4 w-4" />
        ) : (
          <Pause className="h-4 w-4" />
        )}
      </Button>
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditComplete}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditComplete();
            if (e.key === 'Escape') {
              setIsEditing(false);
              setEditValue(formatTime(time));
            }
          }}
          className="w-20 bg-transparent font-mono text-lg font-medium tabular-nums border rounded px-2"
          placeholder="MM:SS"
          autoFocus
        />
      ) : (
        <span
          className={cn(
            "font-mono text-lg font-medium tabular-nums cursor-pointer",
            getTimeColor(),
            isPaused && "hover:underline"
          )}
          onClick={handleStartEdit}
          title={isPaused ? "Click to edit time" : undefined}
        >
          {formatTime(time)}
        </span>
      )}
    </div>
  );
};

export default Timer;