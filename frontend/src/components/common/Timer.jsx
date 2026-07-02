import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

export default function Timer({ running = true, onTick, initialSeconds = 0 }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef(null);
  const onTickRef = useRef(onTick);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Call onTick outside of setState updater to avoid React warning
  useEffect(() => {
    if (seconds > 0) onTickRef.current?.(seconds);
  }, [seconds]);

  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');

  return (
    <span style={{ fontFamily: 'Space Mono', fontSize: 14, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Clock size={14} />{m}:{s}
    </span>
  );
}
