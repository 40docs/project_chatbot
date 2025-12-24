export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  fields: CredentialField[];
  models: ModelOption[];
  defaultModel: string;
  supportsRag?: boolean;
}

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password';
  required: boolean;
}

export interface ValidationResult {
  valid: boolean;
  provider: string;
  error?: {
    code: string;
    message: string;
  };
}

export type ValidationStatus = 'idle' | 'validating' | 'success' | 'error';
