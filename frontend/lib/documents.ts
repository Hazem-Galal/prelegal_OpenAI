const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SavedDocumentSummary = {
  id: string;
  documentTypeId: string;
  updatedAt: string;
};

export type SavedDocument = {
  id: string;
  documentTypeId: string;
  fieldValues: Record<string, unknown>;
  updatedAt: string;
};

export async function saveDocument(
  documentId: string,
  documentTypeId: string,
  fieldValues: Record<string, unknown>
): Promise<void> {
  await fetch(`${API_BASE_URL}/api/documents/save`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ documentId, documentTypeId, fieldValues }),
  });
}

export async function listMyDocuments(): Promise<SavedDocumentSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/documents/mine`, {
    credentials: "include",
  });
  if (!response.ok) return [];
  return response.json();
}

export async function getSavedDocument(documentId: string): Promise<SavedDocument | null> {
  const response = await fetch(`${API_BASE_URL}/api/documents/mine/${documentId}`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  return response.json();
}
