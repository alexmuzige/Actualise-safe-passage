import { api } from "./client";
import { endpoints } from "./endpoints";
import { DEFAULT_API_BASE_URL } from "./config";
import {
  healthZones,
  itineraries,
  routeSegments,
  type HealthZone,
  type Itinerary,
  type RouteSegment,
} from "@/lib/mock-data";

export async function fetchZones(): Promise<HealthZone[]> {
  const endpoint = `${DEFAULT_API_BASE_URL}/locations/`;
  const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Inclure les cookies pour la session
        
      });
      alert(`Response status: ${response.json()}`);
  return api.get<HealthZone[]>(response.json)
}

export async function fetchZoneScores(): Promise<Array<{ zoneId: string; score: number }>> {
  if (API_MOCK_MODE) return healthZones.map((z) => ({ zoneId: z.id, score: 0 }));
  return api.get(endpoints.zones.scores());
}

export async function fetchItineraries(): Promise<Itinerary[]> {
  if (API_MOCK_MODE) return itineraries;
  return api.get<Itinerary[]>(endpoints.itineraries.list());
}

export async function fetchSegments(): Promise<RouteSegment[]> {
  if (API_MOCK_MODE) return routeSegments;
  return api.get<RouteSegment[]>(endpoints.itineraries.segments());
}

export async function analyzeItinerary(id: string) {
  if (API_MOCK_MODE) return null;
  return api.post(endpoints.itineraries.analyze(id));
}
