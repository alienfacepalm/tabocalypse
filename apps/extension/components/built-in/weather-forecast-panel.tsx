import React from "react";
import {
  CloudRain,
  Droplets,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { TemperatureHighLowRange, TemperatureValue } from "../temperature-value";
import {
  formatPrecipChancePercent,
  formatPrecipSum,
  formatUvIndexMax,
  formatWeatherSunTime,
  formatWindSpeedMax,
} from "../../lib/weather/format-weather-daily-detail";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import type { IOnThisDayFact } from "../../lib/weather/fetch-on-this-day-trivia";
import type { IWeatherDayForecast, IWeatherSnapshot } from "../../lib/weather/fetch-weather";
import type { IWeatherHudEngagement } from "../../lib/weather/weather-hud-engagement";
import { WeatherConditionIcon } from "../../lib/weather/weather-condition-icon";
import { HudTip } from "../hud-tip";
import { PrivilegedFetchUserError } from "../privileged-fetch-user-error";
import type { TWeatherTemperatureUnit } from "../../lib/weather/weather-units";

type TWeatherDetailRow = {
  label: string;
  value: React.ReactNode;
  Icon: LucideIcon;
};

function buildTodayDetailRows(
  day: IWeatherDayForecast,
  temperatureUnit: TWeatherTemperatureUnit,
  displayLocale: string,
): TWeatherDetailRow[] {
  const rows: TWeatherDetailRow[] = [];
  const precipChance = formatPrecipChancePercent(day.precipChancePercent);
  if (precipChance) {
    rows.push({ label: "Precip chance", value: precipChance, Icon: Droplets });
  }
  const precipAmount = formatPrecipSum(day.precipSum, temperatureUnit, displayLocale);
  if (precipAmount) {
    rows.push({ label: "Precip amount", value: precipAmount, Icon: CloudRain });
  }
  const wind = formatWindSpeedMax(
    day.windSpeedMax,
    day.windDirectionDegrees,
    temperatureUnit,
    displayLocale,
  );
  if (wind) rows.push({ label: "Wind", value: wind, Icon: Wind });
  if (day.feelsLikeHigh != null && day.feelsLikeLow != null) {
    rows.push({
      label: "Feels like",
      Icon: Thermometer,
      value: (
        <TemperatureHighLowRange
          high={day.feelsLikeHigh}
          low={day.feelsLikeLow}
          unit={temperatureUnit}
          locale={displayLocale}
        />
      ),
    });
  }
  rows.push({
    label: "High / low",
    Icon: Thermometer,
    value: (
      <TemperatureHighLowRange
        high={day.high}
        low={day.low}
        unit={temperatureUnit}
        locale={displayLocale}
      />
    ),
  });
  const uv = formatUvIndexMax(day.uvIndexMax, displayLocale);
  if (uv) rows.push({ label: "UV index", value: uv, Icon: Sun });
  const sunrise = formatWeatherSunTime(day.sunrise, displayLocale);
  if (sunrise) rows.push({ label: "Sunrise", value: sunrise, Icon: Sunrise });
  const sunset = formatWeatherSunTime(day.sunset, displayLocale);
  if (sunset) rows.push({ label: "Sunset", value: sunset, Icon: Sunset });
  return rows;
}

function WeatherDetailGrid({ rows }: { rows: TWeatherDetailRow[] }): React.JSX.Element {
  return (
    <dl className="weather-ten-day-detail-grid mt-3">
      {rows.map((row) => (
        <React.Fragment key={row.label}>
          <dt className="weather-ten-day-detail-label">
            <row.Icon
              size={14}
              strokeWidth={2}
              className="weather-ten-day-detail-icon"
              aria-hidden
            />
            <span>{row.label}</span>
          </dt>
          <dd>{row.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export function WeatherForecastPanel({
  current,
  today,
  temperatureUnit,
  displayLocale,
  gamificationEnabled,
  engagement,
  trivia,
  triviaLoading,
  triviaError,
}: {
  current: IWeatherSnapshot;
  today: IWeatherDayForecast;
  temperatureUnit: TWeatherTemperatureUnit;
  displayLocale: string;
  gamificationEnabled: boolean;
  engagement: IWeatherHudEngagement | null;
  trivia: IOnThisDayFact[];
  triviaLoading: boolean;
  triviaError: string | null;
}): React.JSX.Element {
  const detailRows = buildTodayDetailRows(today, temperatureUnit, displayLocale);

  return (
    <div>
      <div
        className="weather-forecast-hero"
        aria-label={`${formatTemperatureValue(current.temperature, current.temperatureUnit, displayLocale)}, ${current.summary}`}
      >
        <WeatherConditionIcon code={current.code} />
        <div className="min-w-0 flex-1">
          <p className="weather-temp">
            <TemperatureValue
              value={current.temperature}
              unit={current.temperatureUnit}
              locale={displayLocale}
            />
          </p>
          <p className="weather-condition-label">
            <span>{current.summary}</span>
          </p>
        </div>
        {gamificationEnabled && engagement ? (
          <HudTip tip="Local HUD streak — open Forecast daily to earn points. No account; stored on this device only.">
            <p
              className="weather-hud-engagement"
              aria-label={`Weather streak ${engagement.streakDays} days, ${engagement.totalPoints} points`}
            >
              <span className="weather-hud-engagement-streak">{engagement.streakDays}d streak</span>
              <span className="weather-hud-engagement-points">{engagement.totalPoints} pts</span>
            </p>
          </HudTip>
        ) : null}
      </div>
      <WeatherDetailGrid rows={detailRows} />
      <section className="weather-on-this-day mt-4" aria-label="On this day">
        <h4 className="weather-on-this-day-title">On this day</h4>
        {triviaLoading ? <p className="muted sm mt-0">Loading trivia…</p> : null}
        {triviaError ? <PrivilegedFetchUserError error={triviaError} /> : null}
        {!triviaLoading && !triviaError && trivia.length === 0 ? (
          <p className="muted sm mt-0">No facts loaded for today.</p>
        ) : null}
        <ul className="weather-on-this-day-list">
          {trivia.map((fact) => (
            <li key={`${fact.year}-${fact.text}`}>
              {fact.year > 0 ? <span className="weather-on-this-day-year">{fact.year}</span> : null}
              <span>{fact.text}</span>
            </li>
          ))}
        </ul>
        <p className="weather-on-this-day-credit muted sm">
          Facts from Wikipedia via Wikimedia.
          {gamificationEnabled
            ? " Read one while you check the forecast to grow your local streak."
            : null}
        </p>
      </section>
    </div>
  );
}

export { buildTodayDetailRows };
