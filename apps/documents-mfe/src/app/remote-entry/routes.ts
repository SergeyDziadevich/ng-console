import { Routes } from "@angular/router";
import { DocumentsComponent } from "../features/documents/documents.component";
import { DocumentGeneratorComponent } from "../features/documents/generator/document-generator.component";
import { DocumentViewerComponent } from "../features/documents/viewer/document-viewer.component";
import { ExternalSignatureComponent } from "../features/documents/external-signature/external-signature.component";

export const externalSignatureRoutes: Routes = [
  { path: "", component: ExternalSignatureComponent },
];

export const documentRoutes: Routes = [
  { path: "", component: DocumentsComponent },
  { path: "generate", component: DocumentGeneratorComponent },
  { path: ":id/:mode", component: DocumentViewerComponent },
];

export const ROUTES: Routes = [
  { path: "sign-invoice", children: externalSignatureRoutes },
  { path: "", children: documentRoutes },
];