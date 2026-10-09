# Vajra Inventory Management - Stage 3.1: AI Recognition Foundation

This document outlines the architecture, flow, and integration details for Stage 3.1: the foundational pipeline for AI-based product recognition.

## 1. Architecture

The AI Recognition system uses a robust, scalable architecture prioritizing cost-efficiency and security.

- **Frontend (`AICamera.tsx`)**: Handles capturing the image, basic client-side validation (format, resolution, size), and state management.
- **Service Layer (`RecognitionService.ts`)**: Prepares the image (base64 encoding, compression if needed) and sends it directly to the backend. It does not upload to Firebase Storage at this stage to save bandwidth and storage costs.
- **Backend (Firebase Cloud Functions: `recognizeProduct`)**: Receives the base64 image, validates it, and securely communicates with the Gemini API using Firebase Secrets.
- **AI Model**: Uses `gemini-2.5-flash` via `@google/genai` for fast, cost-effective multimodal recognition.

## 2. Request Flow

1. **Camera Capture**: User captures an image of a product.
2. **Client Validation**: The frontend validates the file (exists, JPEG/PNG/WebP, meets minimum resolution and maximum size constraints).
3. **Data Encoding**: `RecognitionService` converts the image to a base64 string.
4. **Cloud Function Invocation**: The frontend calls the `recognizeProduct` Firebase Cloud Function with `{ imageBase64: "..." }`.
5. **Gemini API Call**: The Cloud Function sends the image and a strict JSON-enforced prompt to Gemini 2.5 Flash.
6. **Response parsing**: The Cloud Function processes the JSON response from Gemini, injecting timing and metadata.
7. **Frontend Update**: `RecognitionService` returns the structured JSON to `AICamera.tsx`, which updates the UI based on the specific `status` flag.

## 3. Gemini Prompt Strategy

To ensure high-quality recognition without database matching at this stage, the prompt explicitly instructs Gemini to:
- Ignore the background, tables, human hands, shadows, and phone reflections.
- Focus ONLY on the stationery item closest to the center.
- Identify if the image is too blurry, too dark, or if multiple distinct products are visible.
- Always output strict JSON matching a defined schema.

## 4. Response Schema

Every recognition attempt returns a standardized JSON object. This structure is future-proofed for later stages.

```json
{
  "status": "SUCCESS",
  "recognitionId": "REC-20260723-000001",
  "engineVersion": "3.1.0",
  "model": "gemini-2.5-flash",
  "promptVersion": "1.0",
  "prediction": {
    "name": "Cello Gripper",
    "brand": "Cello",
    "category": "Ball Pen",
    "confidence": 0.97,
    "confidenceReason": "Brand and product name clearly visible",
    "imageQuality": "GOOD",
    "multipleProducts": false,
    "productVisible": true
  },
  "timing": {
    "gemini": 820,
    "total": 950
  }
}
```

## 5. Status & Error Codes

The frontend relies on a unified `status` field to drive UI behavior. Possible values:

- `SUCCESS`: A single product was clearly recognized.
- `NO_PRODUCT_FOUND`: The image doesn't appear to contain a recognizable product.
- `MULTIPLE_PRODUCTS_FOUND`: More than one distinct product is visible.
- `IMAGE_TOO_BLURRY`: The image is out of focus.
- `LOW_LIGHT`: The image is too dark to read labels.
- `PARTIAL_PRODUCT`: The product is cut off or occluded.
- `INVALID_IMAGE`: The uploaded file is corrupt or unsupported.
- `API_TIMEOUT`: The AI service took too long to respond.
- `INTERNAL_ERROR`: An unexpected backend error occurred.

## 6. Testing Steps (Manual Verification)

1. Navigate to the AI Camera in the frontend.
2. Ensure you have network connectivity and Firebase Emulators / Live project running.
3. Capture a clear photo of a single stationery product.
   - **Expected**: UI shows 'SUCCESS' state with Brand, Category, and Confidence.
4. Capture a photo with multiple different products.
   - **Expected**: UI flags 'MULTIPLE_PRODUCTS_FOUND' and asks for a single item.
5. Capture a blurry photo.
   - **Expected**: UI flags 'IMAGE_TOO_BLURRY' and prompts for a clearer shot.
6. Verify browser console logs print the breakdown of timing (gemini vs total network time).
