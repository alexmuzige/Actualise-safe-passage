import { API_MOCK_MODE } from "./config";
import { ApiError } from "./client";
import {
  healthZones,
  itineraries,
  routeSegments,
  type HealthZone,
  type Itinerary,
  type RouteSegment,
} from "@/lib/mock-data";

export async function fetchZones(): Promise<HealthZone[]> {
  if (API_MOCK_MODE) return healthZones;
  throw new ApiError("Le serveur ne publie pas encore de route de liste des zones.", 501);
}

export async function fetchZoneScores(): Promise<Array<{ zoneId: string; score: number }>> {
  if (API_MOCK_MODE) return healthZones.map((z) => ({ zoneId: z.id, score: 0 }));
  throw new ApiError("Le serveur ne publie pas encore de route de scores des zones.", 501);
}

export async function fetchItineraries(): Promise<Itinerary[]> {
  if (API_MOCK_MODE) return itineraries;
  throw new ApiError("Le serveur ne publie pas encore de route d'itinéraires.", 501);
}

export async function fetchSegments(): Promise<RouteSegment[]> {
  if (API_MOCK_MODE) return routeSegments;
  throw new ApiError("Le serveur ne publie pas encore de route de tronçons.", 501);
}

export async function analyzeItinerary(id: string) {
  if (API_MOCK_MODE) return null;
  void id;
  throw new ApiError("Le serveur ne publie pas encore de route d'analyse d'itinéraire.", 501);
}
