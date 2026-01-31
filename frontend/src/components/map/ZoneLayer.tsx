"use client";

import { GeoJSON } from "react-leaflet";
import { useMemo } from "react";
import type { GeoJSON as GeoJSONType } from "geojson";

interface ZoneFeatureProperties {
  type: string;
  zone_name?: string;
  zone_no?: string;
  zone_score?: number;
  area_count?: number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}

interface ZoneLayerProps {
  geojson: GeoJSON.FeatureCollection | null;
  visible: boolean;
}

function zoneStyle(feature?: GeoJSON.Feature<GeoJSON.Polygon, ZoneFeatureProperties>) {
  const p = feature?.properties;
  if (!p) return {};
  return {
    fillColor: p.fill ?? "#95A5A6",
    fillOpacity: p.fillOpacity ?? 0.25,
    color: p.stroke ?? "#7F8C8D",
    weight: p.strokeWidth ?? 3,
    opacity: p.strokeOpacity ?? 0.8,
  };
}

export function ZoneLayer({ geojson, visible }: ZoneLayerProps) {
  const zoneFeatures = useMemo(() => {
    if (!geojson?.features) return null;
    const zones = geojson.features.filter(
      (f): f is GeoJSON.Feature<GeoJSON.Polygon, ZoneFeatureProperties> =>
        f.type === "Feature" && (f.properties as ZoneFeatureProperties)?.type === "zone"
    );
    if (zones.length === 0) return null;
    return { type: "FeatureCollection" as const, features: zones };
  }, [geojson]);

  if (!visible || !zoneFeatures) return null;

  return (
    <GeoJSON
      data={zoneFeatures as GeoJSONType}
      style={(feature) => zoneStyle(feature as GeoJSON.Feature<GeoJSON.Polygon, ZoneFeatureProperties>)}
      onEachFeature={(feature, layer) => {
        const props = feature.properties as ZoneFeatureProperties;
        layer.bindTooltip(
          `${props.zone_name ?? "Zone"}${props.zone_score != null ? ` (score: ${props.zone_score})` : ""}`,
          { sticky: true }
        );
      }}
    />
  );
}
