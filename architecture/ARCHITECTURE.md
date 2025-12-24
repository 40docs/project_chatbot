# Architecture Design Document
## LLM Chat Portal - Claude Replica Interface

**Document ID**: ADD-LLM-PORTAL-001
**Version**: 1.0.0
**Date**: 2025-12-22
**Spec Reference**: SRS-LLM-PORTAL-001 v1.0.0

---

## 1. Architecture Overview

### 1.1 System Architecture Style
The system follows a **component-based frontend architecture** with a lightweight backend API layer. This architecture prioritizes:
- Rapid development and iteration
- Clean separation of UI concerns
- Extensible provider integration pattern

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Chat UI    │  │  Settings UI │  │   State Management   │  │
│  │  Components  │  │  Components  │  │   (Context/Hooks)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Service Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              LLM Provider Adapter                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │  │
│  │  │ Anthropic  │  │  OpenAI    │  │ SageMaker  │          │  │
│  │  │  Adapter   │  │  Adapter   │  │  RAG       │          │  │
│  │  └────────────┘  └────────────┘  └────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │  /api/chat     │  │ /api/settings  │  │  /api/validate  │   │
│  │  (messages)    │  │ (credentials)  │  │  (test keys)    │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Provider Integration                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  LLM Provider Factory                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │   External LLM APIs    │
                 │  Anthropic, OpenAI,    │
                 │  SageMaker Endpoints   │
                 └────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React 18+ | Component model ideal for chat UI, hooks for state |
| Styling | Tailwind CSS 3+ | Rapid styling, easy to match Claude aesthetic |
| Build Tool | Vite | Fast development server, optimized builds |
| HTTP Client | Fetch API | Native streaming support for SSE |
| State | React Context + useReducer | Sufficient for app complexity, no Redux overhead |

### 2.2 Backend Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | FastAPI | Async support, automatic OpenAPI docs, Python ML ecosystem |
| Server | Uvicorn | ASGI server, streaming response support |
| Validation | Pydantic | Type safety, request/response validation |

### 2.3 Infrastructure

| Component | Technology |
|-----------|------------|
| Containerization | Docker |
| Local Development | Docker Compose |
| Future Orchestration | Kubernetes (EKS) |

---

## 3. Component Architecture

### 3.1 Frontend Components

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx      # Main chat area wrapper
│   │   ├── MessageList.tsx        # Scrollable message container
│   │   ├── MessageBubble.tsx      # Individual message display
│   │   ├── MessageInput.tsx       # Text input with send button
│   │   └── StreamingMessage.tsx   # Handles typing effect
│   │
│   ├── sidebar/
│   │   ├── Sidebar.tsx            # Conversation list container
│   │   ├── ConversationItem.tsx   # Single conversation entry
│   │   └── NewChatButton.tsx      # Create conversation button
│   │
│   ├── settings/
│   │   ├── SettingsModal.tsx      # Settings overlay container
│   │   ├── ProviderSelect.tsx     # Provider dropdown
│   │   ├── CredentialFields.tsx   # Dynamic credential inputs
│   │   ├── ValidationStatus.tsx   # Green check / Red error
│   │   └── RagToggle.tsx          # RAG on/off toggle (SageMaker only)
│   │
│   └── layout/
│       ├── Header.tsx             # Top bar with logo, settings icon
│       └── MainLayout.tsx         # Overall page structure
│
├── context/
│   ├── ChatContext.tsx            # Conversation state management
│   └── SettingsContext.tsx        # Provider/credential state
│
├── services/
│   ├── providers/
│   │   ├── index.ts               # Provider factory
│   │   ├── anthropic.ts           # Anthropic API adapter
│   │   └── types.ts               # Provider interface definitions
│   │
│   └── api.ts                     # Backend API client
│
├── config/
│   └── providers.ts               # Provider configuration registry
│
└── App.tsx                        # Root component
```

### 3.2 Provider Configuration Pattern

The provider system uses a registry pattern for extensibility:

```typescript
// config/providers.ts
export interface ProviderConfig {
  id: string;
  name: string;
  fields: CredentialField[];
  validateEndpoint: string;
}

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password';
  required: boolean;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true }
    ],
    validateEndpoint: '/api/validate/anthropic'
  },
  {
    id: 'sagemaker',
    name: 'SageMaker RAG',
    fields: [],  // Uses IAM role, no API key needed
    supportsRag: true  // Enables RAG toggle in UI
  }
];
```

### 3.3 Backend API Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI application entry
│   ├── routers/
│   │   ├── chat.py                # Chat/message endpoints
│   │   ├── settings.py            # Credential management
│   │   └── validate.py            # API key validation
│   │
│   ├── services/
│   │   ├── providers/
│   │   │   ├── base.py            # Abstract provider interface
│   │   │   ├── anthropic.py       # Anthropic implementation
│   │   │   ├── openai.py          # OpenAI implementation
│   │   │   ├── sagemaker.py       # SageMaker RAG implementation
│   │   │   └── factory.py         # Provider instantiation
│   │   │
│   │   └── validation.py          # Key validation logic
│   │
│   ├── models/
│   │   ├── chat.py                # Message/Conversation models
│   │   └── settings.py            # Credential models
│   │
│   └── config.py                  # Application configuration
│
└── requirements.txt
```

---

## 4. Data Flow

### 4.1 Chat Message Flow

```
User Input → MessageInput → ChatContext → API Client → Backend
                                                          │
                                                          ▼
                                                   Provider Adapter
                                                          │
                                                          ▼
                                                   Anthropic API
                                                          │
                                                          ▼
                                                   SSE Stream Response
                                                          │
                                                          ▼
User Display ← StreamingMessage ← MessageList ← ChatContext
```

### 4.2 Credential Validation Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ SettingsModal│────▶│ Submit Form  │────▶│ POST /api/   │
│              │     │              │     │ validate     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │ Provider     │
                                          │ Test Call    │
                                          └──────────────┘
                                                 │
                           ┌─────────────────────┴─────────────────────┐
                           ▼                                           ▼
                    ┌──────────────┐                           ┌──────────────┐
                    │   Success    │                           │   Failure    │
                    │  200 + OK    │                           │ 4xx + error  │
                    └──────────────┘                           └──────────────┘
                           │                                           │
                           ▼                                           ▼
                    ┌──────────────┐                           ┌──────────────┐
                    │ Green Check  │                           │  Red Button  │
                    │ Store Creds  │                           │ Show Error   │
                    └──────────────┘                           └──────────────┘
```

---

## 5. API Specification

### 5.1 Validation Endpoint

**POST** `/api/validate/{provider}`

**Request:**
```json
{
  "credentials": {
    "apiKey": "sk-ant-..."
  }
}
```

**Response (Success):**
```json
{
  "valid": true,
  "provider": "anthropic"
}
```

**Response (Failure):**
```json
{
  "valid": false,
  "provider": "anthropic",
  "error": {
    "code": "invalid_api_key",
    "message": "Invalid API key provided"
  }
}
```

### 5.2 Chat Endpoint

**POST** `/api/chat`

**Request:**
```json
{
  "conversationId": "uuid",
  "message": "Hello, how are you?",
  "provider": "anthropic"
}
```

**Response:** Server-Sent Events (SSE) stream

---

## 6. State Management

### 6.1 Chat State

```typescript
interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### 6.2 Settings State

```typescript
interface SettingsState {
  provider: string;
  credentials: Record<string, string>;
  validationStatus: 'idle' | 'validating' | 'success' | 'error';
  validationError: string | null;
  ragEnabled: boolean;  // For SageMaker RAG provider
}
```

---

## 7. Extensibility Points

### 7.1 Adding a New Provider

1. **Add to provider registry** (`config/providers.ts`):
   ```typescript
   {
     id: 'openai',
     name: 'OpenAI',
     fields: [
       { key: 'apiKey', label: 'API Key', type: 'password', required: true }
     ],
     validateEndpoint: '/api/validate/openai'
   }
   ```

2. **Create backend adapter** (`backend/app/services/providers/openai.py`)

3. **Add validation route** (`backend/app/routers/validate.py`)

No frontend component changes required.

### 7.2 SageMaker RAG Provider

The SageMaker provider integrates with AWS SageMaker infrastructure for self-hosted LLM inference with optional RAG (Retrieval-Augmented Generation).

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SageMaker RAG Provider                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Question ──▶ SageMaker Provider                                       │
│                           │                                                 │
│                           ├── RAG Enabled? ──▶ Query Processor Lambda       │
│                           │                           │                     │
│                           │                           ▼                     │
│                           │                    OpenSearch (k-NN)            │
│                           │                           │                     │
│                           │                           ▼                     │
│                           │                    Context Retrieved            │
│                           │                           │                     │
│                           ├───────────────────────────┘                     │
│                           ▼                                                 │
│                    Format Mistral Prompt (with/without context)             │
│                           │                                                 │
│                           ▼                                                 │
│                    SageMaker LLM Endpoint (Streaming)                       │
│                           │                                                 │
│                           ▼                                                 │
│                    SSE Response to Frontend                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **No API Key Required**: Uses EC2 IAM role for authentication
- **RAG Toggle**: Users can enable/disable document context retrieval
- **Streaming**: Real-time token streaming via `invoke_endpoint_with_response_stream`
- **Cold Start Handling**: Graceful messaging when endpoints are starting (5-10 min)

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `SAGEMAKER_LLM_ENDPOINT` | SageMaker LLM endpoint name |
| `QUERY_PROCESSOR_LAMBDA` | Lambda function for RAG context retrieval |
| `AWS_REGION` | AWS region for boto3 clients |

---

## 8. Deployment Architecture

### 8.1 Docker Compose (Phase 1)

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - STORAGE_TYPE=ephemeral
```

### 8.2 Kubernetes Ready (Phase 2)

Architecture designed for:
- Stateless frontend containers
- Stateless backend containers
- External configuration via ConfigMaps/Secrets
- Horizontal pod autoscaling ready

---

## Appendix A: Module Boundaries

| Module | Owns | Does Not Own |
|--------|------|--------------|
| frontend-portal | All React components, styling, client-side state | Backend logic, API implementation |
| backend-api | API routes, provider adapters, validation logic | UI components, styling |

---

## Appendix B: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-22 | System | Initial architecture |
| 1.1.0 | 2025-12-24 | Claude | Added SageMaker RAG provider integration |
