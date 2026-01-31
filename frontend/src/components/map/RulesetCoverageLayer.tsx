"use client";

import { GeoJSON } from "react-leaflet";
import { useMemo } from "react";
import type { GeoJSON as GeoJSONType } from "geojson";
import type { Area, ZoneScoringRuleSet, ZoneScore } from "../../types";

const COVERED_STYLE = {
  fillColor: "#2B8A3E",
  fillOpacity: 0.6,
  color: "#1B5E20",
  weight: 1.5,
  opacity: 0.9,
};

const NOT_COVERED_STYLE = {
  fillColor: "#95A5A6",
  fillOpacity: 0.35,
  color: "#7F8C8D",
  weight: 1,
  opacity: 0.6,
};

function scoreToColor(score: number, min: number, max: number): string {
  if (max === min) return "#2B8A3E";
  const t = (score - min) / (max - min);
  const r = Math.round(255 * (1 - t));
  const g = Math.round(255 * t);
  return `rgb(${r},${g},100)`;
}

interface RulesetCoverageLayerProps {
  areas: Area[];
  ruleset: ZoneScoringRuleSet | null;
  zoneScores: ZoneScore[];
  visible: boolean;
}

export function RulesetCoverageLayer({ areas, ruleset, zoneScores, visible }: RulesetCoverageLayerProps) {
  const coveredIds = useMemo(() => {
    if (!ruleset?.scoringParams) return new Set<number>();
    return new Set(ruleset.scoringParams.map((p) => p.areaId));
  }, [ruleset]);

  const scoreByAreaId = useMemo(() => {
    const map = new Map<number, number>();
    for (const s of zoneScores) {
      const n = parseFloat(s.score);
      if (!Number.isNaN(n)) map.set(s.areaId, n);
    }
    return map;
  }, [zoneScores]);

  const scoreRange = useMemo(() => {
    const values = Array.from(scoreByAreaId.values());
    if (values.length === 0) return null;
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [scoreByAreaId]);

  const featureCollection = useMemo(() => {
    const features: GeoJSON.Feature<
      GeoJSON.Polygon,
      { areaId: number; covered: boolean; name: string; score: number | null }
    >[] = [];
    for (const area of areas) {
      if (!area.geojson?.coordinates?.length) continue;
      const covered = coveredIds.has(area.id);
      const score = scoreByAreaId.get(area.id) ?? null;
      features.push({
        type: "Feature",
        properties: {
          areaId: area.id,
          covered,
          name: area.name ?? `Area ${area.id}`,
          score: score !== undefined ? score : null,
        },
        geometry: {
          type: "Polygon",
          coordinates: area.geojson.coordinates,
        },
      });
    }
    return features.length ? { type: "FeatureCollection" as const, features } : null;
  }, [areas, coveredIds, scoreByAreaId]);

  if (!visible || !ruleset || !featureCollection) return null;

  return (
    <GeoJSON
      data={featureCollection as GeoJSONType}
      pathOptions={{ interactive: false }}
      style={(feature) => {
        const props = feature?.properties as {
          covered?: boolean;
          score?: number | null;
        };
        const covered = props?.covered ?? false;
        if (!covered) return NOT_COVERED_STYLE;
        const score = props?.score;
        if (scoreRange && score != null && !Number.isNaN(score)) {
          return {
            ...COVERED_STYLE,
            fillColor: scoreToColor(score, scoreRange.min, scoreRange.max),
          };
        }
        return COVERED_STYLE;
      }}
      onEachFeature={(feature, layer) => {
        const props = feature.properties as { name: string; covered: boolean; score: number | null };
        const scorePart =
          props.score != null && !Number.isNaN(props.score)
            ? ` · Zone score: ${Number(props.score).toFixed(2)}`
            : "";
        layer.bindTooltip(
          `${props.name} · ${props.covered ? "In ruleset" : "Not in ruleset"}${scorePart}`,
          { sticky: true }
        );
      }}
    />
  );
}
