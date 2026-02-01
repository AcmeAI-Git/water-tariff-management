"use client";

import { useState, useEffect, useMemo } from "react";
import { MapView } from "../components/map/MapView";
import { AreaLayer, type ColorByOption, type AreaClickDetails } from "../components/map/AreaLayer";
import { RulesetCoverageLayer } from "../components/map/RulesetCoverageLayer";
import { Popup } from "react-leaflet";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useApiQuery } from "../hooks/useApiQuery";
import { api } from "../services/api";
import type { FeatureCollection, Polygon, Feature } from "geojson";
import type { ZoneScoringRuleSet, Area, ZoneScore, Zone } from "../types";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

const GEOJSON_URL = "/data/zones_and_areas_combined.geojson";

const COLOR_BY_OPTIONS: { value: ColorByOption; label: string }[] = [
  { value: "zone_score", label: "Zone score" },
  { value: "zone_name", label: "Zone" },
  { value: "tax_zone", label: "Tax zone" },
  { value: "thana", label: "Thana" },
  { value: "union", label: "Union" },
  { value: "mauza", label: "Mauza" },
];

/** Palette for Zone (zone_name) legend - must match AreaLayer ZONE_PALETTE order. */
const ZONE_PALETTE = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA15E", "#6C5CE7", "#A29BFE", "#FD79A8", "#FDCB6E",
];

/** Only rulesets with status 'active' or 'published' are the current active ruleset (used for zone score map). */
function isActiveOrPublished(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "active" || s === "published";
}

export default function TariffMap() {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [colorBy, setColorBy] = useState<ColorByOption>("zone_score");
  const [selectedAreaKey, setSelectedAreaKey] = useState<string | null>(null);
  const [selectedAreaDetails, setSelectedAreaDetails] = useState<AreaClickDetails | null>(null);

  const { data: rulesetsData } = useApiQuery<ZoneScoringRuleSet[]>(
    ["zone-scoring"],
    () => api.zoneScoring.getAll()
  );
  const rulesets = (rulesetsData ?? []) as ZoneScoringRuleSet[];
  const activeRulesets = rulesets.filter((r) => isActiveOrPublished(r.status));
  const activeRuleset = colorBy === "zone_score" ? (activeRulesets[0] ?? null) : null;

  const { data: areasData } = useApiQuery<Area[]>(
    ["areas"],
    () => api.area.getAll()
  );
  const areas = (areasData ?? []) as Area[];

  const { data: zonesData } = useApiQuery<Zone[]>(
    ["zones"],
    () => api.zones.getAll(),
    { enabled: colorBy === "zone_score" && areas.length > 0 }
  );
  const zones = (zonesData ?? []) as Zone[];
  const zoneById = useMemo(() => {
    const m = new Map<number, Zone>();
    for (const z of zones) m.set(Number(z.id), z);
    return m;
  }, [zones]);

  const { data: zoneScoresData } = useApiQuery<ZoneScore[]>(
    ["zone-scoring-scores"],
    () => api.zoneScoring.getScores(),
    { enabled: colorBy === "zone_score" && !!activeRuleset }
  );
  const zoneScores = (zoneScoresData ?? []) as ZoneScore[];
  const zoneScoresForRuleset =
    colorBy === "zone_score" && activeRuleset
      ? zoneScores.filter((s) => Number(s.ruleSetId) === Number(activeRuleset.id))
      : [];

  /** When coloring by zone_score: use static geojson as base and enrich with API zone scores (so tax_zone/thana/union stay from static). Otherwise use static geojson. */
  const areaGeojsonForMap = useMemo((): FeatureCollection | null => {
    if (colorBy === "zone_score" && geojson?.features) {
      const scoreByAreaId = new Map<number, number>();
      for (const s of zoneScoresForRuleset) {
        const n = parseFloat(s.score);
        if (!Number.isNaN(n)) scoreByAreaId.set(Number(s.areaId), n);
      }
      // API area by (zone, name) -> score for matching static features
      const apiByKey = new Map<string, number>();
      for (const area of areas) {
        const zone = area.zone ?? zoneById.get(Number(area.zoneId));
        const zoneName = (zone?.name ?? "").trim();
        const zoneNo = (zone?.zoneNo ?? "").trim();
        const name = (area.name ?? "").trim();
        const score = scoreByAreaId.get(Number(area.id));
        if (score === undefined) continue;
        apiByKey.set(`${zoneName}\t${name}`, score);
        apiByKey.set(`${zoneNo}\t${name}`, score);
        apiByKey.set(`${zoneName.toLowerCase()}\t${name.toLowerCase()}`, score);
        apiByKey.set(`${zoneNo}\t${name.toLowerCase()}`, score);
      }
      const getScore = (zonePart: string, mauzaPart: string): number | undefined =>
        apiByKey.get(`${zonePart}\t${mauzaPart}`) ?? apiByKey.get(`${zonePart}\t${mauzaPart.toLowerCase()}`);

      type StaticAreaProps = { type?: string; zone_name?: string; zone_no?: string; mauza?: string; tax_zone?: string; thana?: string; union?: string; geocode?: string };
      const enrichedFeatures = geojson.features
        .filter((f): f is Feature<Polygon, StaticAreaProps> =>
          f.type === "Feature" && (f.properties as StaticAreaProps)?.type === "area"
        )
        .map((f) => {
          const p = f.properties as StaticAreaProps;
          const zoneName = (p.zone_name ?? "").trim();
          const zoneNo = (p.zone_no ?? "").trim();
          const mauza = (p.mauza ?? "").trim();
          const score =
            getScore(zoneName, mauza) ?? getScore(zoneNo, mauza) ?? getScore(zoneName.toLowerCase(), mauza.toLowerCase()) ?? getScore(zoneNo, mauza.toLowerCase());
          return {
            ...f,
            properties: {
              ...p,
              type: "area" as const,
              zone_score: score !== undefined ? score : undefined,
            },
          };
        });

      // Append API-only areas (no matching static feature) so they still appear
      const staticKeys = new Set<string>();
      for (const f of geojson.features) {
        if (f.type !== "Feature" || (f.properties as StaticAreaProps)?.type !== "area") continue;
        const p = f.properties as StaticAreaProps;
        const z = (p.zone_name ?? p.zone_no ?? "").trim();
        const m = (p.mauza ?? "").trim();
        if (z || m) staticKeys.add(`${z}\t${m}`);
      }
      for (const area of areas) {
        if (!area.geojson?.coordinates?.length) continue;
        const zone = area.zone ?? zoneById.get(Number(area.zoneId));
        const zoneName = (zone?.name ?? "").trim();
        const name = (area.name ?? "").trim();
        if (staticKeys.has(`${zoneName}\t${name}`)) continue;
        const score = scoreByAreaId.get(Number(area.id));
        enrichedFeatures.push({
          type: "Feature",
          geometry: area.geojson as Polygon,
          properties: {
            type: "area",
            zone_name: zone?.name,
            zone_score: score !== undefined ? score : undefined,
            geocode: String(area.id),
            mauza: area.name,
            tax_zone: undefined,
            thana: undefined,
            union: undefined,
          },
        });
      }
      return { type: "FeatureCollection", features: enrichedFeatures };
    }
    return geojson;
  }, [colorBy, geojson, areas, zoneScoresForRuleset, zoneById]);

  const uniqueZoneNames = useMemo(() => {
    if (!areaGeojsonForMap?.features || colorBy !== "zone_name") return [];
    const seen = new Set<string>();
    const order: string[] = [];
    for (const f of areaGeojsonForMap.features) {
      if (f.type !== "Feature" || (f.properties as { type?: string })?.type !== "area") continue;
      const p = f.properties as { zone_name?: string; zone_no?: string };
      const v = (p.zone_name ?? p.zone_no ?? "").trim() || "—";
      if (!seen.has(v)) {
        seen.add(v);
        order.push(v);
      }
    }
    return order.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [areaGeojsonForMap, colorBy]);

  useEffect(() => {
    let cancelled = false;
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setGeojson(data as FeatureCollection);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load GeoJSON:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-white text-center">
        <h1 className="text-xl font-semibold text-gray-900">Tariff Map</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Dhaka WASA zones and areas. Color by category.
        </p>
      </div>

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <div className="w-64 shrink-0 flex flex-col gap-5 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Color by</Label>
              <Select value={colorBy} onValueChange={(v) => setColorBy(v as ColorByOption)}>
                <SelectTrigger className="mt-1.5 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_BY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {colorBy === "zone_score" && (
                <p className="mt-2 text-xs text-gray-500">
                  Shows the currently active ruleset.
                </p>
              )}
            </div>
          </div>

          {/* Legend in sidebar */}
          {((colorBy === "zone_name" || colorBy === "tax_zone") || (colorBy === "zone_score" && activeRuleset)) && (
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Legend</span>
              {colorBy === "zone_name" && uniqueZoneNames.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-gray-700">Zone</span>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {uniqueZoneNames.map((name, i) => (
                      <div key={name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 shrink-0 rounded border border-gray-300"
                          style={{ backgroundColor: ZONE_PALETTE[i % ZONE_PALETTE.length] }}
                        />
                        <span className="text-xs text-gray-700 truncate" title={name}>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {colorBy === "tax_zone" && (
                <div>
                  <span className="text-xs font-semibold text-gray-700">Tax zone</span>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 shrink-0 rounded border border-[#C92A2A]" style={{ backgroundColor: "#C92A2A" }} />
                      <span className="text-xs text-gray-700">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 shrink-0 rounded border border-[#E67700]" style={{ backgroundColor: "#E67700" }} />
                      <span className="text-xs text-gray-700">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 shrink-0 rounded border border-[#2B8A3E]" style={{ backgroundColor: "#2B8A3E" }} />
                      <span className="text-xs text-gray-700">Low</span>
                    </div>
                  </div>
                </div>
              )}
              {colorBy === "zone_score" && activeRuleset && (
                <div>
                  <span className="text-xs font-semibold text-gray-700">Coverage</span>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 shrink-0 rounded border border-[#1B5E20]" style={{ backgroundColor: "rgba(43,138,62,0.6)" }} />
                      <span className="text-xs text-gray-700">Covered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 shrink-0 rounded border border-[#7F8C8D]" style={{ backgroundColor: "rgba(149,165,166,0.35)" }} />
                      <span className="text-xs text-gray-700">Not covered</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-[400px] rounded-lg border border-gray-200 overflow-hidden bg-gray-100 relative">
          {!geojson && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-[1000]">
              <LoadingSpinner />
            </div>
          )}
          <MapView className="h-full min-h-[400px]">
            <AreaLayer
              geojson={areaGeojsonForMap}
              visible={true}
              colorBy={colorBy}
              selectedAreaKey={selectedAreaKey}
              onAreaClick={(key, details) => {
                setSelectedAreaKey((prev) => {
                  if (prev === key) {
                    setSelectedAreaDetails(null);
                    return null;
                  }
                  setSelectedAreaDetails(details);
                  return key;
                });
              }}
            />
            {selectedAreaDetails && (
              <Popup
                position={selectedAreaDetails.latlng}
                eventHandlers={{
                  remove: () => {
                    setSelectedAreaDetails(null);
                    setSelectedAreaKey(null);
                  },
                }}
                className="area-details-popup-wrapper"
              >
                <div className="area-details-popup min-w-[200px] max-w-[280px]">
                  <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-2">
                    {selectedAreaDetails.name}
                  </h3>
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 shrink-0">Zone</dt>
                      <dd className="font-medium text-gray-800 text-right">{selectedAreaDetails.zone_name ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 shrink-0">Tax zone</dt>
                      <dd className="font-medium text-gray-800 text-right">{selectedAreaDetails.tax_zone ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 shrink-0">Thana</dt>
                      <dd className="font-medium text-gray-800 text-right">{selectedAreaDetails.thana ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 shrink-0">Union</dt>
                      <dd className="font-medium text-gray-800 text-right">{selectedAreaDetails.union ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 shrink-0">Mauza</dt>
                      <dd className="font-medium text-gray-800 text-right">{selectedAreaDetails.mauza ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500 shrink-0">Zone score</dt>
                      <dd className="font-medium text-gray-800 text-right">
                        {selectedAreaDetails.zone_score != null
                          ? Number(selectedAreaDetails.zone_score).toFixed(2)
                          : "—"}
                      </dd>
                    </div>
                    {selectedAreaDetails.geocode && (
                      <div className="flex justify-between gap-4 pt-1 border-t border-gray-100">
                        <dt className="text-gray-500 shrink-0">Geocode</dt>
                        <dd className="font-mono text-gray-700 text-right text-[11px] break-all">{selectedAreaDetails.geocode}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Popup>
            )}
            <RulesetCoverageLayer
              areas={areas}
              ruleset={activeRuleset}
              zoneScores={zoneScoresForRuleset}
              visible={colorBy === "zone_score" && !!activeRuleset}
            />
          </MapView>
        </div>
      </div>
    </div>
  );
}
