import { initFederation } from "@angular-architects/native-federation";

initFederation("/assets/federation.manifest.json")
  .catch((err: unknown) => console.error("Failed to initialize federation manifest:", err))
  .then(() => import("./bootstrap"))
  .catch((err: unknown) => console.error("Failed to bootstrap Host Application:", err));