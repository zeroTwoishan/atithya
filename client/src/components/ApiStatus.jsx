import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { api } from "../lib/api";

// Proves the Vite <-> Django wiring works end to end. Safe to delete once
// real screens are wired up (docs/BUILD_PLAN.md hours 0-2 checkpoint).
export function ApiStatus() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get("/health").then((res) => res.data),
    retry: false,
  });

  if (isError) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-status-negative">
        <XCircle size={16} weight="fill" /> API unreachable
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm text-secondary">
      <CheckCircle size={16} weight="fill" /> API: {data?.data?.status ?? "checking…"}
    </span>
  );
}
