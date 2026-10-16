import { apiClient } from "../../common/api/client.ts";
import { createWheelMockAdapter } from "./mock-api.ts";
import type { WheelConfig, SpinResult } from "./contracts.ts";

export function createWheelApi() {
  const adapter = createWheelMockAdapter();
  return {
    async getConfig(signal: AbortSignal): Promise<WheelConfig> {
      const { data } = await apiClient.get<WheelConfig>("/games/lucky-wheel", {
        signal,
        adapter,
      });
      return data;
    },
    async spin(requestId: string, signal: AbortSignal): Promise<SpinResult> {
      const { data } = await apiClient.post<SpinResult>(
        "/games/lucky-wheel/spins",
        { requestId },
        { signal, adapter },
      );
      return data;
    },
  };
}
