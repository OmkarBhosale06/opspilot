export type OpsEvent = {
  type: string;
  incidentId?: string;
  clusterId: string;
  namespace?: string;
  timestamp: string;
  message?: string;
  status?: string;
  step?: string;
  data?: unknown;
};

export type EventHandler = (event: OpsEvent) => void;
