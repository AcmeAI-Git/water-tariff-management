"use client";

import { GeoJSON } from "react-leaflet";
import { useMemo } from "react";
import type { GeoJSON as GeoJSONType } from "geojson";

export type ColorByOption =
  | "zone_name"
  | "tax_zone"
  | "zone_score"
  | "thana"
  | "union"
  | "mauza";

interface AreaFeatureProperties {
  type: string;
  zone_name?: string;
  zone_no?: string;
  zone_score?: number;
  thana?: string;
  union?: string;
  mauza?: string;
  geocode?: string;
  tax_zone?: string;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}

const TAX_ZONE_COLORS: Record<string, string> = {
  "High Tax Zone": "#C92A2A",
  "Medium Tax Zone": "#E67700",
  "Low Tax Zone": "#2B8A3E",
};

const ZONE_PALETTE = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA15E", "#6C5CE7", "#A29BFE", "#FD79A8", "#FDCB6E",
];

function getColorByValue(
  colorBy: ColorByOption,
  props: AreaFeatureProperties,
  uniqueValues: string[] | number[],
  numericRange?: { min: number; max: number }
): string {
  if (colorBy === "zone_score" && numericRange && props.zone_score != null) {
    const { min, max } = numericRange;
    const t = max === min ? 0 : (props.zone_score - min) / (max - min);
    const r = Math.round(255 * (1 - t));
    const g = Math.round(255 * t);
    return `rgb(${r},${g},100)`;
  }
  let value: string | undefined;
  switch (colorBy) {
    case "zone_name":
      value = props.zone_name ?? props.zone_no ?? "";
      break;
    case "tax_zone":
      return TAX_ZONE_COLORS[props.tax_zone ?? ""] ?? "#95A5A6";
    case "thana":
      value = props.thana ?? "";
      break;
    case "union":
      value = props.union ?? "";
      break;
    case "mauza":
      value = props.mauza ?? "";
      break;
    default:
      value = props.zone_name ?? "";
  }
  const idx = uniqueValues.indexOf(value as never);
  if (idx === -1) return "#95A5A6";
  return ZONE_PALETTE[idx % ZONE_PALETTE.length];
}

/** Unique key for an area feature (for click-to-highlight). */
export function getAreaFeatureKey(props: AreaFeatureProperties): string {
  if (props.geocode) return props.geocode;
  return [props.zone_name, props.mauza, props.thana, props.union].filter(Boolean).join("|") || "unknown";
}

/** Details passed when an area is clicked (for popup). */
export interface AreaClickDetails {
  latlng: [number, number];
  name: string;
  mauza?: string;
  zone_name?: string;
  zone_no?: string;
  tax_zone?: string;
  thana?: string;
  union?: string;
  geocode?: string;
  zone_score?: number;
}

const HIGHLIGHT_STROKE = { weight: 4, color: "#4C6EF5", opacity: 1 };

interface AreaLayerProps {
  geojson: GeoJSON.FeatureCollection | null;
  visible: boolean;
  colorBy: ColorByOption;
  selectedAreaKey?: string | null;
  onAreaClick?: (key: string, details: AreaClickDetails) => void;
}

export function AreaLayer({ geojson, visible, colorBy, selectedAreaKey = null, onAreaClick }: AreaLayerProps) {
  const { areaFeatures, uniqueValues, numericRange } = useMemo(() => {
    if (!geojson?.features) return { areaFeatures: null, uniqueValues: [] as string[], numericRange: undefined };
    const areas = geojson.features.filter(
      (f): f is GeoJSON.Feature<GeoJSON.Polygon, AreaFeatureProperties> =>
        f.type === "Feature" && (f.properties as AreaFeatureProperties)?.type === "area"
    );
    if (areas.length === 0) return { areaFeatures: null, uniqueValues: [] as string[], numericRange: undefined };

    const key = colorBy;
    const values = new Set<string | number>();
    let minScore = Infinity;
    let maxScore = -Infinity;
    areas.forEach((f) => {
      const p = f.properties as AreaFeatureProperties;
      if (key === "zone_score" && p.zone_score != null) {
        minScore = Math.min(minScore, p.zone_score);
        maxScore = Math.max(maxScore, p.zone_score);
      } else {
        const v =
          key === "zone_name"
            ? p.zone_name ?? p.zone_no ?? ""
            : key === "tax_zone"
              ? p.tax_zone ?? ""
              : key === "thana"
                ? p.thana ?? ""
                : key === "union"
                  ? p.union ?? ""
                  : p.mauza ?? "";
        values.add(v);
      }
    });
    const uniqueValues =
      key === "zone_score"
        ? []
        : (key === "zone_name"
            ? (Array.from(values) as string[]).sort((a, b) =>
                String(a).localeCompare(String(b), undefined, { numeric: true })
              )
            : (Array.from(values) as string[]));
    const numericRange =
      key === "zone_score" && isFinite(minScore) && isFinite(maxScore)
        ? { min: minScore, max: maxScore }
        : undefined;

    return {
      areaFeatures: { type: "FeatureCollection" as const, features: areas },
      uniqueValues,
      numericRange,
    };
  }, [geojson, colorBy]);

  if (!visible || !areaFeatures) return null;

  return (
    <GeoJSON
      data={areaFeatures as GeoJSONType}
      style={(feature) => {
        const props = (feature?.properties ?? {}) as AreaFeatureProperties;
        const fill = getColorByValue(colorBy, props, uniqueValues, numericRange);
        const key = getAreaFeatureKey(props);
        const highlighted = selectedAreaKey != null && key === selectedAreaKey;
        return {
          fillColor: fill,
          fillOpacity: 0.5,
          color: highlighted ? HIGHLIGHT_STROKE.color : "#2C3E50",
          weight: highlighted ? HIGHLIGHT_STROKE.weight : 1,
          opacity: highlighted ? HIGHLIGHT_STROKE.opacity : 0.6,
        };
      }}
      onEachFeature={(feature, layer) => {
        const props = feature.properties as AreaFeatureProperties;
        const key = getAreaFeatureKey(props);
        const name = props.mauza || props.zone_name || "Area";
        const scorePart =
          props.zone_score != null && !Number.isNaN(props.zone_score)
            ? ` · Zone score: ${Number(props.zone_score).toFixed(2)}`
            : "";
        layer.bindTooltip(`${name}${scorePart}`, { sticky: false, direction: "top" });
        if (onAreaClick) {
          layer.on("click", (e: { latlng: { lat: number; lng: number } }) => {
            onAreaClick(key, {
              latlng: [e.latlng.lat, e.latlng.lng],
              name,
              mauza: props.mauza,
              zone_name: props.zone_name,
              zone_no: props.zone_no,
              tax_zone: props.tax_zone,
              thana: props.thana,
              union: props.union,
              geocode: props.geocode,
              zone_score: props.zone_score,
            });
          });
        }
      }}
    />
  );
}
