import React, { useEffect, useState } from "react";
import { getAnalogClockAngles } from "../../lib/clock-analog-angles";

const TICK_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export function ClockAnalogFace({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setNow(new Date());
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const { hourDeg, minuteDeg, secondDeg } = getAnalogClockAngles(now, timeZone);

  return (
    <svg className="clock-analog-face" viewBox="0 0 100 100" role="img" aria-hidden>
      <circle className="clock-analog-dial" cx="50" cy="50" r="46" />
      {TICK_INDICES.map((index) => (
        <line
          key={index}
          className={index % 3 === 0 ? "clock-analog-tick-major" : "clock-analog-tick"}
          x1="50"
          y1="8"
          x2="50"
          y2={index % 3 === 0 ? "14" : "12"}
          transform={`rotate(${index * 30} 50 50)`}
        />
      ))}
      <line
        className="clock-analog-hand clock-analog-hand-hour"
        x1="50"
        y1="50"
        x2="50"
        y2="30"
        transform={`rotate(${hourDeg} 50 50)`}
      />
      <line
        className="clock-analog-hand clock-analog-hand-minute"
        x1="50"
        y1="50"
        x2="50"
        y2="22"
        transform={`rotate(${minuteDeg} 50 50)`}
      />
      <line
        className="clock-analog-hand clock-analog-hand-second"
        x1="50"
        y1="54"
        x2="50"
        y2="16"
        transform={`rotate(${secondDeg} 50 50)`}
      />
      <circle className="clock-analog-hub" cx="50" cy="50" r="2.5" />
    </svg>
  );
}
