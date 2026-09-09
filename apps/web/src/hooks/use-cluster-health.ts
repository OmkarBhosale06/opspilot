"use client";

import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/services/health";
import type { ConnectionState } from "@/types";

export function useClusterHealth(refetchInterval = 10_000) {
  const query = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval,
    retry: 1,
  });

  let connection: ConnectionState = "disconnected";
  if (query.isSuccess) {
    connection = query.data.k8sConnected ? "connected" : "degraded";
  } else if (query.isFetching && !query.isError) {
    connection = "degraded";
  }

  return {
    ...query,
    connection,
  };
}
