import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminAccess } from "@/lib/admin.functions";

export function useAdminStatus(enabled: boolean) {
  const getAccess = useServerFn(getAdminAccess);
  return useQuery({
    queryKey: ["admin-access"],
    queryFn: () => getAccess(),
    enabled,
    staleTime: 60_000,
  });
}