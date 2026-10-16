import { useQuery } from "@tanstack/react-query";
import { listDriverFreights, listMyFreights } from "./api";
import { useAuth } from "./auth";

export function useDriverFreights() {
  const { user, isDriver } = useAuth();
  return useQuery({
    queryKey: ["freights", "driver", user?.id],
    queryFn: listDriverFreights,
    enabled: isDriver,
    staleTime: 0,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useClientFreights() {
  const { user, isClient } = useAuth();
  return useQuery({
    queryKey: ["freights", "mine", user?.id],
    queryFn: listMyFreights,
    enabled: isClient,
    staleTime: 0,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
}
