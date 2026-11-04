import { api } from "./client";
import { endpoints } from "./endpoints";

export interface TrainModelPayload {
  architecture: string;
  epochs?: number;
  lr?: string;
  cleaning?: boolean;
  vectorization?: boolean;
  scaling?: boolean;
  balancing?: boolean;
}

export async function trainModel(payload: TrainModelPayload): Promise<unknown> {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) body.set(key, String(value));
  }
  return api.post<unknown>(endpoints.analytics.train(), body);
}

export async function simulateInference(): Promise<unknown> {
  return api.post<unknown>(endpoints.analytics.simulateInference());
}

export async function confirmReportDecision(reportId: number): Promise<unknown> {
  return api.post<unknown>(endpoints.analytics.confirmReport(reportId));
}

export async function overrideReportDecision(reportId: number, risk: 1 | 2 | 3): Promise<unknown> {
  const body = new URLSearchParams({ new_risk: String(risk) });
  return api.post<unknown>(endpoints.analytics.overrideReport(reportId), body);
}
