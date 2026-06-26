export interface IAnalogClockAngles {
  hourDeg: number;
  minuteDeg: number;
  secondDeg: number;
}

function readTimeZoneParts(
  date: Date,
  timeZone: string,
): {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    hours: get("hour") % 12,
    minutes: get("minute"),
    seconds: get("second"),
    milliseconds: date.getMilliseconds(),
  };
}

/** Hour/minute/second hand rotation in degrees for a 12-hour analog dial (0° = 12 o'clock). */
export function getAnalogClockAngles(date: Date, timeZone: string): IAnalogClockAngles {
  const { hours, minutes, seconds, milliseconds } = readTimeZoneParts(date, timeZone);
  const secondFraction = seconds + milliseconds / 1000;
  const minuteFraction = minutes + secondFraction / 60;
  const hourFraction = hours + minuteFraction / 60;

  return {
    secondDeg: secondFraction * 6,
    minuteDeg: minuteFraction * 6,
    hourDeg: hourFraction * 30,
  };
}
