import { useTimeMachine } from '../contexts/TimeContext';

export function useCurrentTime(): Date {
  const { currentTime } = useTimeMachine();
  return currentTime;
}
