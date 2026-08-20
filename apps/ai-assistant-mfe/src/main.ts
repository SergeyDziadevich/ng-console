import { initFederation } from "@angular-architects/native-federation";

initFederation()
  .catch((err: unknown) => console.error("Failed to initialize federation:", err))
  .then(() => import("./bootstrap"))
  .catch((err: unknown) => console.error("Failed to bootstrap ai-assistant-mfe:", err));