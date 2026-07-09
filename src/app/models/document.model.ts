export interface UploadedDocument {
  _id: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: string | { _id: string, username: string, email: string, displayName?: string };
  isSigned?: boolean;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDocuments {
  items: UploadedDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
