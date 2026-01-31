"use client";

import { useState, useEffect } from "react";
import { MapView } from "../components/map/MapView";
import { ZoneLayer } from "../components/map/ZoneLayer";
import { AreaLayer, type ColorByOption, type AreaClickDetails } from "../components/map/AreaLayer";
import { RulesetCoverageLayer } from "../components/map/RulesetCoverageLayer";
import { Popup } from "react-leaflet";
import { Info } from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";
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
import type { FeatureCollection } from "geojson";
import type { ZoneScoringRuleSet, Area, ZoneScore } from "../types";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

const GEOJSON_URL = "/data/zones_and_areas_combined.geojson";

const COLOR_BY_OPTIONS: { value: ColorByOption; label: string }[] = [
  { value: "zone_name", label: "Zone" },
  { value: "tax_zone", label: "Tax zone" },
  { value: "zone_score", label: "Zone score" },
  { value: "thana", label: "Thana" },
  { value: "union", label: "Union" },
  { value: "mauza", label: "Mauza" },
];

function isApprovedOrPublished(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "approved" || s === "published" || s === "active";
}

export default function TariffMap() {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [zoneLayerOn, setZoneLayerOn] = useState(true);
  const [areaLayerOn, setAreaLayerOn] = useState(true);
  const [coverageLayerOn, setCoverageLayerOn] = useState(false);
  const [colorBy, setColorBy] = useState<ColorByOption>("tax_zone");
  const [rulesetId, setRulesetId] = useState<string>("");
  const [selectedAreaKey, setSelectedAreaKey] = useState<string | null>(null);
  const [selectedAreaDetails, setSelectedAreaDetails] = useState<AreaClickDetails | null>(null);

  const { data: rulesetsData } = useApiQuery<ZoneScoringRuleSet[]>(
    ["zone-scoring"],
    () => api.zoneScoring.getAll()
  );
  const rulesets = (rulesetsData ?? []) as ZoneScoringRuleSet[];
  const activeRulesets = rulesets.filter((r) => isApprovedOrPublished(r.status));

  const { data: selectedRulesetData } = useApiQuery<ZoneScoringRuleSet | null>(
    ["zone-scoring", rulesetId],
    () => (rulesetId ? api.zoneScoring.getById(parseInt(rulesetId, 10)) : Promise.resolve(null)),
    { enabled: !!rulesetId }
  );
  const selectedRuleset = rulesetId ? (selectedRulesetData as ZoneScoringRuleSet | undefined) ?? null : null;

  const { data: areasData } = useApiQuery<Area[]>(
    ["areas"],
    () => api.area.getAll()
  );
  const areas = (areasData ?? []) as Area[];

  // Zone scores from API: only when ruleset coverage layer is on and a ruleset is selected (active rules only in dropdown)
  const { data: zoneScoresData } = useApiQuery<ZoneScore[]>(
    ["zone-scoring-scores"],
    () => api.zoneScoring.getScores(),
    { enabled: coverageLayerOn && !!rulesetId }
  );
  const zoneScores = (zoneScoresData ?? []) as ZoneScore[];
  const zoneScoresForRuleset =
    rulesetId && coverageLayerOn
      ? zoneScores.filter((s) => s.ruleSetId === parseInt(rulesetId, 10))
      : [];

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
          Dhaka WASA zones and areas. Toggle layers and color by category.
        </p>
      </div>

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <div className="w-64 shrink-0 flex flex-col gap-5 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          {/* Zone layer */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Layers</span>
            <label
              htmlFor="layer-zone"
              className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
            >
              <Checkbox
                id="layer-zone"
                checked={zoneLayerOn}
                onCheckedChange={(c) => setZoneLayerOn(!!c)}
              />
              <span className="text-sm font-medium text-gray-800">Zone boundaries</span>
            </label>
          </div>

          {/* Areas: checkbox + color by */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Areas</span>
            <label
              htmlFor="layer-area"
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
            >
              <Checkbox
                id="layer-area"
                checked={areaLayerOn}
                onCheckedChange={(c) => setAreaLayerOn(!!c)}
              />
              <span className="text-sm font-medium text-gray-800">Show areas</span>
            </label>
            <div className="pl-8">
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
            </div>
          </div>

          {/* Ruleset coverage: checkbox + ruleset dropdown */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ruleset coverage</span>
            <label
              htmlFor="layer-coverage"
              className={`flex items-center gap-3 rounded-lg px-2 py-2 ${rulesetId ? "cursor-pointer hover:bg-gray-50" : "cursor-not-allowed opacity-70"}`}
            >
              <Checkbox
                id="layer-coverage"
                checked={coverageLayerOn}
                onCheckedChange={(c) => setCoverageLayerOn(!!c)}
                disabled={!rulesetId}
              />
              <span className="text-sm font-medium text-gray-800">Show coverage</span>
            </label>
            <div className="pl-8">
              <Label className="text-xs text-gray-600">Applied tariff ruleset</Label>
              <Select value={rulesetId || "none"} onValueChange={(v) => setRulesetId(v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1.5 h-9">
                  <SelectValue placeholder="Select ruleset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeRulesets.length === 0 ? (
                    <SelectItem value="empty" disabled>No approved/published rulesets</SelectItem>
                  ) : (
                    activeRulesets.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.title ?? `Ruleset #${r.id}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">Approved/published only</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[400px] rounded-lg border border-gray-200 overflow-hidden bg-gray-100 relative">
          {/* Legend overlay: top-right, semi-transparent */}
          {(areaLayerOn && colorBy === "tax_zone") || (coverageLayerOn && rulesetId) ? (
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-3 rounded-lg border border-gray-200/80 bg-white/90 px-3 py-2.5 shadow-md backdrop-blur-sm">
              {areaLayerOn && colorBy === "tax_zone" && (
                <div>
                  <span className="text-xs font-semibold text-gray-700">Tax zone</span>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-[#C92A2A]" style={{ backgroundColor: "#C92A2A" }} />
                      <span className="text-xs text-gray-700">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-[#E67700]" style={{ backgroundColor: "#E67700" }} />
                      <span className="text-xs text-gray-700">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-[#2B8A3E]" style={{ backgroundColor: "#2B8A3E" }} />
                      <span className="text-xs text-gray-700">Low</span>
                    </div>
                  </div>
                </div>
              )}
              {coverageLayerOn && rulesetId && (
                <div className={areaLayerOn && colorBy === "tax_zone" ? "border-t border-gray-200 pt-2" : ""}>
                  <span className="text-xs font-semibold text-gray-700">Coverage</span>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-[#1B5E20]" style={{ backgroundColor: "rgba(43,138,62,0.6)" }} />
                      <span className="text-xs text-gray-700">Covered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-[#7F8C8D]" style={{ backgroundColor: "rgba(149,165,166,0.35)" }} />
                      <span className="text-xs text-gray-700">Not covered</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Zone score note: bottom overlay when "Zone score" is selected */}
          {colorBy === "zone_score" && (
            <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-start gap-2 rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2.5 shadow-md backdrop-blur-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              <p className="text-xs font-medium leading-snug text-amber-900">
                Zone scores are only shown when clicking areas defined in an active zone scoring ruleset. Turn on <strong>Ruleset coverage</strong> and select a ruleset to see scores on the map.
              </p>
            </div>
          )}

          {!geojson && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-[1000]">
              <LoadingSpinner />
            </div>
          )}
          <MapView className="h-full min-h-[400px]">
            <ZoneLayer geojson={geojson} visible={zoneLayerOn} />
            <AreaLayer
              geojson={geojson}
              visible={areaLayerOn}
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
              ruleset={selectedRuleset}
              zoneScores={zoneScoresForRuleset}
              visible={coverageLayerOn && !!rulesetId}
            />
          </MapView>
        </div>
      </div>
    </div>
  );
}
