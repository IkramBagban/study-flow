# Feature Plan: Resource Management & PDF Ingestion

This document outlines the implementation plan for a production-grade Resource Management system, enabling users to upload, manage, and utilize PDFs (and images) for RAG-based course generation.

**Goal**: Enable users to upload files (PDFs/Images), store them securely (Cloudinary), extract their content (Parsing), and index them for AI retrieval (RAG), with a robust UI to manage these assets.

---

## 1. Architecture: The "Storage Abstraction" Pattern

To ensure we can switch from Cloudinary to S3/R2/GCS in the future without rewriting business logic, we will use the **Repository/Adapter Pattern** (or a simple Interface-based Service).

### The Interface
We will define a strict contract for storage operations:
```typescript
interface StorageProvider {
  upload(file: File, path: string): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string): Promise<string>; // For private files later
}
```

### The Implementation
*   **Current**: `CloudinaryStorageProvider`
*   **Future**: `S3StorageProvider`, `R2StorageProvider`

The rest of the app (API routes) will only import `StorageService` which dynamically selects the provider based on env vars.

---

## 2. Implementation Checklist

### Phase 1: Storage Infrastructure
- [x] **Install Dependencies**: `cloudinary`, `pdf-parse`.
- [x] **Create Storage Service**: `lib/storage/storage-service.ts` implementing the abstraction above.
- [x] **Implement Cloudinary Adapter**: Logic to stream uploads to Cloudinary.

### Phase 2: PDF Parsing & Ingestion (Backend)
- [x] **Update Upload API** (`api/course/[id]/resources/upload`):
    - Accept `application/pdf`.
    - **Step 1**: Upload raw file to Cloudinary via `StorageService`.
    - **Step 2**: Download buffer for processing (or use stream).
    - **Step 3**: Parse text using `pdf-parse`.
    - **Step 4**: Clean text (remove headers/footers/page numbers).
    - **Step 5**: Pass clean text to `ingestResource` (existing RAG logic).
    - **Step 6**: Save `url` and `fileKey` in the `Resource` database record.

### Phase 3: Resource Management (Database)
- [x] **Schema Update**: Update `Resource` model in Prisma.
    - Add `url` (String?): To store the Cloudinary public URL.
    - Add `fileKey` (String?): To store the storage ID (for deletion).
    - Add `metadata` (Json?): For page counts, author, file size.
- [x] **Migration**: Run `prisma migrate dev`.

### Phase 4: Frontend UI (Resource Dash)
- [x] **Resource List Component**:
    - Build `components/resource/resource-list.tsx`.
    - Columns: File Name, Type (PDF/Text), Size, Upload Date, Action (Delete/View).
    - "View" button opens the Cloudinary URL.
- [x] **Visual Feedback**:
    - Progress bar during upload.
    - Status indicators ("Indexing...", "Ready").

### Phase 5: Cleanup & Lifecycle
- [x] **Delete API**:
    - When user deletes resource:
        1. Remove from Vector DB (`embedding` table).
        2. Remove from SQL DB (`resource` table).
        3. **Critical**: Call `StorageService.delete()` to remove from Cloudinary.

---

## 3. Best Practices to Follow
1.  **Immutability**: Don't overwrite files. Use unique keys (e.g., `courses/{courseId}/{uuid}-{filename}`).
2.  **Security**: Validate file types (`application/pdf`, `image/*`) strictly on the server. Limit file size (e.g., 10MB).
3.  **Observability**: Log every step (Upload Start -> Store Complete -> Parse Start -> Vectorize Complete) to debug "stuck" uploads.
4.  **Graceful Degration**: If parsing fails, *delete* the uploaded file from storage so we don't have orphan files.

---

## 4. Dependencies
```bash
bun add cloudinary pdf-parse
bun install @types/pdf-parse -D
```
