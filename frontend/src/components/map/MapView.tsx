"use client";

import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { TileLayer } from "react-leaflet";
import { LeafletProvider, createLeafletContext } from "@react-leaflet/core";

const DHAKA_CENTER: [number, number] = [23.81, 90.41];
const DEFAULT_ZOOM = 11;

interface MapViewProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Map is created imperatively so we init only once per container and avoid
 * "Map container is already initialized" when React Strict Mode runs ref
 * callbacks twice. We provide the same context that MapContainer would.
 */
export function MapView({ children, className = "" }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<ReturnType<typeof createLeafletContext> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if ((el as unknown as { _leaflet_id?: number })._leaflet_id != null) return;

    const map = L.map(el, { scrollWheelZoom: true }).setView(DHAKA_CENTER, DEFAULT_ZOOM);
    setContext(createLeafletContext(map));
    return () => {
      map.remove();
      setContext(null);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full min-h-[400px] ${className}`}
      style={{ zIndex: 0 }}
    >
      {context && (
        <LeafletProvider value={context}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {children}
        </LeafletProvider>
      )}
    </div>
  );
}
