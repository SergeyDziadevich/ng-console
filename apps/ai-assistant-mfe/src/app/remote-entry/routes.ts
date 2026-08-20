import { Routes } from "@angular/router";
import { AiAssistantComponent } from "../features/ai-assistant/ai-assistant.component";

export const aiAssistantRoutes: Routes = [
  { path: "", component: AiAssistantComponent },
];

export const ROUTES: Routes = aiAssistantRoutes;