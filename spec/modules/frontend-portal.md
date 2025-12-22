# Module Prompt: Frontend Portal
## Constrained Implementation Guide

**Module ID**: MOD-FRONTEND-PORTAL
**Spec Reference**: SRS-LLM-PORTAL-001 v1.0.0
**Architecture Reference**: ADD-LLM-PORTAL-001 v1.0.0

---

## Module Scope

You are implementing the **frontend-portal** module. Your work is constrained to the boundaries defined below. Do not implement functionality outside this scope.

### You ARE responsible for:
- React component implementation for chat interface
- React component implementation for settings page
- Client-side state management (Context/Hooks)
- Styling with Tailwind CSS
- API client for backend communication
- Provider configuration registry

### You are NOT responsible for:
- Backend API implementation
- LLM provider integration logic
- Database or storage implementation
- Authentication/authorization systems
- Docker/Kubernetes configuration

---

## Technical Constraints

You MUST use the following technologies:

| Concern | Technology | Non-Negotiable |
|---------|------------|----------------|
| Framework | React 18+ | Yes |
| Styling | Tailwind CSS 3+ | Yes |
| Build | Vite | Yes |
| HTTP | Fetch API (native) | Yes |
| State | React Context + useReducer | Yes |

Do NOT introduce:
- Redux, MobX, or other state management libraries
- CSS-in-JS libraries (styled-components, emotion)
- UI component libraries (MUI, Chakra, Ant Design)
- Additional HTTP clients (axios)

---

## Required Implementation

### 1. Chat Interface Components

Implement the following components as specified in FR-CHAT-01 through FR-CHAT-06:

#### ChatContainer.tsx
- Wrapper component for the main chat area
- Manages scroll behavior
- Contains MessageList and MessageInput

#### MessageList.tsx
- Renders list of MessageBubble components
- Auto-scrolls to newest message
- Handles empty state

#### MessageBubble.tsx
- Displays individual message
- Props: `role: 'user' | 'assistant'`, `content: string`, `timestamp: Date`
- User messages: right-aligned, distinct background
- Assistant messages: left-aligned, distinct background
- Include copy-to-clipboard action

#### MessageInput.tsx
- Multi-line textarea with auto-resize
- Send button
- Keyboard shortcut: Cmd/Ctrl+Enter to send
- Disabled state while awaiting response

#### StreamingMessage.tsx
- Handles progressive text display
- Typing cursor indicator
- Smooth character-by-character or chunk rendering

### 2. Sidebar Components

#### Sidebar.tsx
- Container for conversation list
- Collapsible (desktop: toggle, mobile: overlay)
- Contains NewChatButton and ConversationItem list

#### ConversationItem.tsx
- Displays conversation title/preview
- Click to select conversation
- Visual indicator for active conversation
- Truncate long titles with ellipsis

#### NewChatButton.tsx
- Prominent button to create new conversation
- Clears chat area on click
- Adds new conversation to state

### 3. Settings Components

#### SettingsModal.tsx
- Modal overlay triggered from header
- Close button (X)
- Contains ProviderSelect, CredentialFields, ValidationStatus

#### ProviderSelect.tsx
- Dropdown select element
- Options loaded from provider registry (`config/providers.ts`)
- Initial implementation: Anthropic only
- On change: update credential fields dynamically

#### CredentialFields.tsx
- Renders input fields based on selected provider
- Read field configuration from provider registry
- Password-type masking for sensitive fields
- All fields controlled components

#### ValidationStatus.tsx
- Displays validation result
- Success state: Green checkmark/arrow icon
- Error state: Red button/indicator with error message
- Props: `status: 'idle' | 'validating' | 'success' | 'error'`, `errorMessage?: string`

### 4. Layout Components

#### Header.tsx
- Application logo/title (left)
- Settings icon button (right)
- Fixed position at top

#### MainLayout.tsx
- Orchestrates Sidebar, ChatContainer, Header
- Responsive layout structure

### 5. State Management

#### ChatContext.tsx
```typescript
interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
}

// Required actions:
// - ADD_CONVERSATION
// - SET_ACTIVE_CONVERSATION
// - ADD_MESSAGE
// - UPDATE_STREAMING_MESSAGE
// - SET_STREAMING
```

#### SettingsContext.tsx
```typescript
interface SettingsState {
  provider: string;
  credentials: Record<string, string>;
  validationStatus: 'idle' | 'validating' | 'success' | 'error';
  validationError: string | null;
}

// Required actions:
// - SET_PROVIDER
// - SET_CREDENTIAL
// - SET_VALIDATION_STATUS
// - SET_VALIDATION_ERROR
```

### 6. Provider Registry

#### config/providers.ts

```typescript
export interface ProviderConfig {
  id: string;
  name: string;
  fields: CredentialField[];
}

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password';
  required: boolean;
}

// Initial implementation - Anthropic only
export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true }
    ]
  }
];
```

### 7. API Client

#### services/api.ts

Implement functions for:
- `validateCredentials(provider: string, credentials: object): Promise<ValidationResult>`
- `sendMessage(conversationId: string, message: string): AsyncGenerator<string>` (streaming)
- `getConversations(): Promise<Conversation[]>`

---

## UI/UX Requirements

### Visual Design
- Replicate Claude.ai aesthetic
- Clean, minimal interface
- Adequate whitespace
- Clear visual hierarchy

### Color Palette (Reference)
- Background: Light gray/off-white
- User bubble: Light blue/purple tint
- Assistant bubble: White/light gray
- Accent: Claude orange/coral for buttons
- Success: Green (#22c55e)
- Error: Red (#ef4444)

### Typography
- System font stack or Inter
- Message text: 14-16px
- Clear line height for readability

### Responsiveness
- Minimum supported width: 1024px
- Sidebar collapsible on smaller viewports

---

## File Structure

Create the following structure:

```
frontend/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── StreamingMessage.tsx
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ConversationItem.tsx
│   │   │   └── NewChatButton.tsx
│   │   ├── settings/
│   │   │   ├── SettingsModal.tsx
│   │   │   ├── ProviderSelect.tsx
│   │   │   ├── CredentialFields.tsx
│   │   │   └── ValidationStatus.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── MainLayout.tsx
│   ├── context/
│   │   ├── ChatContext.tsx
│   │   └── SettingsContext.tsx
│   ├── services/
│   │   └── api.ts
│   ├── config/
│   │   └── providers.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Acceptance Criteria Checklist

Before considering this module complete, verify:

### Chat Interface
- [ ] Messages display in bubble format with user/assistant distinction
- [ ] Conversation sidebar shows list of conversations
- [ ] New conversation can be created
- [ ] Message input accepts multi-line text
- [ ] Send button and Cmd/Ctrl+Enter works
- [ ] Streaming messages display with typing effect
- [ ] Copy message action works

### Settings Page
- [ ] Modal opens from header icon
- [ ] Provider dropdown shows Anthropic
- [ ] Credential fields update based on provider
- [ ] Submit triggers validation
- [ ] Success shows green checkmark
- [ ] Failure shows red indicator with error code
- [ ] Valid credentials are persisted

### General
- [ ] No console errors
- [ ] Responsive on 1024px+ viewports
- [ ] Visual design resembles Claude.ai
- [ ] All specified components implemented
- [ ] State management uses Context/useReducer only

---

## Boundaries - DO NOT EXCEED

The following are explicitly out of scope for this module:

1. **No backend implementation** - Use mock responses if backend unavailable
2. **No authentication** - Assume single user
3. **No persistent storage** - Use in-memory/localStorage only
4. **No additional providers** - Anthropic only (architecture ready for more)
5. **No advanced features** - No export, search, or highlighting (future phase)
6. **No testing infrastructure** - Focus on implementation
7. **No CI/CD configuration** - Infrastructure module responsibility
8. **No Docker configuration** - Infrastructure module responsibility

---

## Integration Points

### Backend API Expectations

Your API client should expect these endpoints (implemented by backend module):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/validate/{provider}` | Validate credentials |
| POST | `/api/chat` | Send message, receive SSE stream |
| GET | `/api/conversations` | List conversations |

If backend is unavailable, implement mock responses for development.

---

## Version Control

This module prompt is version-locked to:
- **Spec**: SRS-LLM-PORTAL-001 v1.0.0
- **Architecture**: ADD-LLM-PORTAL-001 v1.0.0

Do not implement features from future spec versions without updating this prompt.
