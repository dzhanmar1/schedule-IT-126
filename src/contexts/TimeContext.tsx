import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TimeContextType {
  currentTime: Date;
  isTimeMachineActive: boolean;
  setMockTime: (date: Date | null) => void;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export function TimeProvider({ children }: { children: ReactNode }) {
  const [realTime, setRealTime] = useState(new Date());
  const [mockTime, setMockTime] = useState<Date | null>(null);

  // Update real time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <TimeContext.Provider
      value={{
        currentTime: mockTime || realTime,
        isTimeMachineActive: mockTime !== null,
        setMockTime,
      }}
    >
      {children}
    </TimeContext.Provider>
  );
}

export function useTimeMachine(): TimeContextType {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTimeMachine must be used within a TimeProvider');
  }
  return context;
}
