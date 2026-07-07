import React from "react";
import { CloudRain, Droplets, Thermometer, Wind, type LucideIcon } from "lucide-react";
import { TemperatureValue } from "../temperature-value";
import {
  formatPrecipSum,
  formatRelativeHumidityPercent,
  formatWindSpeedMax,
} from "../../lib/weather/format-weather-daily-detail";
import { formatTemperatureValue } from "../../lib/weather/format-weather-temperature";
import type { IOnThisDayFact } from "../../lib/weather/fetch-on-this-day-trivia";
import type { IWeatherSnapshot } from "../../lib/weather/fetch-weather";
import type { IWeatherHudEngagement } from "../../lib/weather/weather-hud-engagement";
import { WeatherConditionIcon } from "../../lib/weather/weather-condition-icon";
import { PanelTip } from "../panel-sdk";

type TWeatherDetailRow = {
  label: string;
  value: React.ReactNode;
  Icon: LucideIcon;
};

function buildCurrentDetailRows(
  current: IWeatherSnapshot,
  displayLocale: string,
): TWeatherDetailRow[] {
  const rows: TWeatherDetailRow[] = [];
  if (current.feelsLike != null) {
    rows.push({
      label: "Feels like",
      Icon: Thermometer,
      value: (
        <TemperatureValue
          value={current.feelsLike}
          unit={current.temperatureUnit}
          locale={displayLocale}
        />
      ),
    });
  }
  const wind = formatWindSpeedMax(
    current.windSpeed,
    current.windDirectionDegrees,
    current.temperatureUnit,
    displayLocale,
  );
  if (wind) rows.push({ label: "Wind", value: wind, Icon: Wind });
  const humidity = formatRelativeHumidityPercent(current.relativeHumidityPercent);
  if (humidity) rows.push({ label: "Humidity", value: humidity, Icon: Droplets });
  if (current.precipitation != null && current.precipitation > 0) {
    const precipAmount = formatPrecipSum(
      current.precipitation,
      current.temperatureUnit,
      displayLocale,
    );
    if (precipAmount) {
      rows.push({ label: "Precipitation", value: precipAmount, Icon: CloudRain });
    }
  }
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
  displayLocale,
  gamificationEnabled,
  engagement,
  trivia,
}: {
  current: IWeatherSnapshot;
  displayLocale: string;
  gamificationEnabled: boolean;
  engagement: IWeatherHudEngagement | null;
  trivia: IOnThisDayFact[];
}): React.JSX.Element {
  const detailRows = buildCurrentDetailRows(current, displayLocale);

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
          <PanelTip tip="Local HUD streak — open Forecast daily to earn points. No account; stored on this device only.">
            <p
              className="weather-hud-engagement"
              aria-label={`Weather streak ${engagement.streakDays} days, ${engagement.totalPoints} points`}
            >
              <span className="weather-hud-engagement-streak">{engagement.streakDays}d streak</span>
              <span className="weather-hud-engagement-points">{engagement.totalPoints} pts</span>
            </p>
          </PanelTip>
        ) : null}
      </div>
      <WeatherDetailGrid rows={detailRows} />
      {trivia.length > 0 ? (
        <section className="weather-on-this-day mt-4" aria-label="On this day">
          <h4 className="weather-on-this-day-title">On this day</h4>
          <ul className="weather-on-this-day-list">
            {trivia.map((fact) => (
              <li key={`${fact.year}-${fact.text}`}>
                {fact.year > 0 ? (
                  <span className="weather-on-this-day-year">{fact.year}</span>
                ) : null}
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
      ) : null}
    </div>
  );
}

export { buildCurrentDetailRows };
