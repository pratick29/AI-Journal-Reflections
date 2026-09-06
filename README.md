# Personal Gemini Journal

A production-grade, user-authenticated journaling and multi-turn reflection application powered by the **Gemini 3.6 Flash API** and **Cloud Firestore**, featuring federated **Firebase Authentication (Google Sign-In)**, zero-trust owner isolation, the **Cognitive Lens — Reflection & Insight** synthesis engine, and the **Thinking Map — Reasoning Topology** directed acyclic graph (DAG) reasoning visualizer.

Built for the **Google AI Studio Ideathon — Personal Gemini Journal Challenge**.

---

## 1. Architecture & Security Overview

- **User Authentication**: Firebase Authentication via Google Sign-In with cryptographic client-to-server token verification (no passwords stored or managed).
- **Backend Database**: Cloud Firestore with user-isolated document paths (`/users/{userId}/interactions/{interactionId}`) guarded by strict owner-bound security rules (`request.auth.uid == userId`) and schema constraints preventing cross-user data access.
- **AI Processing Engine**: Gemini API running server-side with an automated **Resilient Model Fallback Ladder**:
  - Primary: `gemini-3.6-flash`
  - High-Availability Fallback: `gemini-3.1-flash-lite`
  - Dynamic Alias: `gemini-flash-latest`
  - Deep Reasoning Fallback: `gemini-3.7-flash`
- **Cognitive Lens — Reflection & Insight**: Structured psychological and philosophical distillation extracting foundational axioms, emotional frequency spectrums, unexamined assumptions with reframing, and clickable Socratic inquiries.
- **Thinking Map — Reasoning Topology**: Interactive Directed Acyclic Graph (DAG) visualizer mapping the geometry of the user's reasoning. Features:
  - Enforces strict bounds: **6–12 nodes**, **5–16 edges**, maximum 2 passage citations per node, maximum 300 characters per citation, maximum 8 words per label.
  - **Full DAG Cycle Validation**: Both server-side and client-side BFS reachability cycle detection algorithms reject any cyclic graphs ($A \to B \to C \to A$) before rendering or persisting.
  - **Passage Inspector & Explore in Dialogue**: Interactive drawer displaying verbatim cited passages alongside their epistemic source attribution (`Author's Stated Thought` vs. `Gemini Synthesis`), with a 1-click pivot to continue the dialogue in the composer.
- **Secret Management**: `GEMINI_API_KEY` stored exclusively server-side via Google Cloud Secret Manager and injected at container runtime by Cloud Run (`--set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest`). Zero client exposure, zero hardcoded tokens.
- **OWASP LLM01 Mitigation**: Enclosed prompt boundaries with XML tag demarcation (`<journal_entry>`) and explicit instruction sanitization.
- **Markdown Security**: Strict URL scheme sanitization policy on ReactMarkdown, permitting only safe schemes (`https:`, `http:`, `mailto:`, `tel:`, `#`, relative) and blocking dangerous pseudo-protocols (`javascript:`, `data:`, `vbscript:`).
- **Dialogue Depth Enforcement**: Dual server-side and client-side hard limit capping multi-turn dialogues at 15 user inquiries to prevent document bloat and token runaway while maintaining full viewing, Cognitive Lens distillation, Thinking Map synthesis, and manuscript export functionality.
- **Rate Limiting & Concurrency Guard**: Sliding-window rate limiter (25 req/min per verified user UID) and concurrent in-flight inquiry lock. Configured as a fast, in-memory per-container protection within Cloud Run (note: operates per container instance without external Redis/Memorystore overhead). Supported by HTTP 429 `Retry-After` headers and client cooldown locking.
- **Transaction Verification & Retry Save**: Guaranteed state preservation where user input is never cleared upon database write failure; displays an accessible error banner with an interactive **Retry Save** action.
- **Publication-Ready Manuscript Export**: 1-click Markdown compilation formatting transcripts, axioms, cognitive reframings, and reasoning topologies into publication-ready manuscripts.

---

## 2. Environment & Prerequisites

Ensure the Google Cloud SDK (`gcloud` CLI) is installed and authenticated, and enable the required APIs:

```bash
# Enable required Google Cloud services
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com
```

---

## 3. Cloud Firestore Security Rules

Deploy the following production-hardened rules to enforce mathematical user isolation and schema validation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global default-deny safety net
    match /{document=**} {
      allow read, write: if false;
    }

    // User-isolated journal interactions: strictly isolated to the authenticated owner
    match /users/{userId}/interactions/{interactionId} {
      // Allow read and delete only to the verified owner
      allow read, delete: if request.auth != null && request.auth.uid == userId;

      // Allow create only if caller is owner, data.userId matches path, id matches path, and schema constraints pass
      allow create: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.userId == userId
        && request.resource.data.id == interactionId
        && request.resource.data.title is string
        && request.resource.data.title.size() <= 200
        && request.resource.data.messages is list;

      // Allow update only if caller is owner, immutable fields (userId, id, createdAt) are preserved
      allow update: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.userId == userId
        && request.resource.data.id == resource.data.id
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.title is string
        && request.resource.data.title.size() <= 200
        && request.resource.data.messages is list;
    }
  }
}
```

---

## 4. Secret Manager Bindings

Configure your Gemini API key in Google Cloud Secret Manager and grant access to the Cloud Run runtime service account:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Google Cloud Run Deployment

Build and deploy the containerized application directly to Cloud Run with automatic secret injection:

```bash
# 1. Build and deploy to Cloud Run
gcloud run deploy personal-gemini-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest

# 2. Apply mandatory campaign verification label
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Functional Stability & Test Walkthrough Guide

Every process and user interaction that a user can trigger has a corresponding verification step:

1. **TC-01: Google Authentication & Zero-Trust Access**
   - Click **Sign in with Google** on the landing page.
   - Complete OAuth popup flow; confirm redirect to the private editorial dashboard.
   - Confirm user avatar, email, and security badge are displayed.
2. **TC-02: Multi-Turn Reflection & Fallback Ladder**
   - Input a reflective inquiry into the composer and select writing mode: **Reflect**, **Summarize**, or **Brainstorm**.
   - Press <kbd>Cmd+Enter</kbd> or click **Reflect →**.
   - Verify Gemini’s streaming response rendered in clean editorial typography with the active model badge (`gemini-3.6-flash`).
   - Send follow-up replies; verify context retention across turns.
3. **TC-03: Firestore Owner Isolation & Real-Time Sync**
   - Verify the interaction persists under `/users/{userId}/interactions/{interactionId}`.
   - Confirm entry appears immediately in the left history drawer.
   - Refresh the browser; confirm past entries are loaded strictly for the authenticated UID.
4. **TC-04: Cognitive Lens — Reflection & Insight**
   - Click the **Cognitive Lens** tab.
   - Click **Distill from Manuscript** to run structured philosophical distillation.
   - Verify the **Core Synthesized Axiom**, **Emotional Frequencies Spectrum**, and **Cognitive Blindspots** cards appear.
   - Click any **Socratic Question** pill to immediately populate the dialogue composer.
   - Click **Export** to copy a publication-ready Markdown transcript.
5. **TC-05: Transaction Verification & Error Recovery**
   - If a database failure occurs, user input is never wiped.
   - An accessible error banner appears with an interactive **Retry Save** action.
6. **TC-06: Cryptographic Token Verification & Rate Limiting**
   - Requests to `/api/reflect` send the Firebase Auth ID Token in the `Authorization: Bearer <token>` header.
   - Server validates the token via Google Identity Toolkit before invoking Gemini.
   - Per-user rate limiter limits requests to 25/min per UID with HTTP 429 `Retry-After` headers.
7. **TC-07: Context Protection & 15-Turn Cap**
   - Dialogue composer tracks exchange depth up to 15/15 turns.
   - Upon reaching 15 turns, input composer smoothly closes to prevent token runaway and degradation.
   - Full history, Cognitive Lens, Thinking Map, and manuscript export remain permanently accessible.
8. **TC-08: Thinking Map — Reasoning Topology & Full DAG Validation**
   - At least 2 conversational exchanges required to generate reasoning topology.
   - Click **Thinking Map** tab and select **Generate Thinking Map**.
   - Verify 6–12 node bounds and 5–16 edge bounds are enforced.
   - Confirm server-side and client-side BFS reachability cycle detection prevents any cyclic edges ($A \to B \to C \to A$).
   - Click any node to open the **Passage Inspector**, verifying exact quoted citations and source attributions.
   - Click **Explore in Dialogue** to pivot directly into the composer with contextual inquiry pre-filled.
9. **TC-09: Google Maps Platform & Places API (New) Locus of Reflection**
   - Click **Locus** in the Journal Editor header or composer toolbar.
   - Search for a city, landmark, or sanctuary (e.g., "Walden Pond") using modern Places API Autocomplete suggestions.
   - Verify session-token bundled Place details resolution (`displayName`, `formattedAddress`, `location`, `viewport`).
   - Confirm interactive Parchment Google Map pans to the sanctuary, drops an `AdvancedMarker` with a custom terracotta Pin, and automatically fetches live atmospheric weather via Open-Meteo.
   - Test clicking on the map canvas to dynamically reposition the locus and adjust coordinates.
   - Click **Inscribe Locus**; verify the assigned locus name and temperature are displayed in the header pill and persisted with the manuscript.

