import type { ProviderConfig } from '../types';

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true }
    ],
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Latest balanced model' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Most capable model' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest model' },
    ],
    defaultModel: 'claude-sonnet-4-20250514'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true }
    ],
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, multimodal' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High capability' },
    ],
    defaultModel: 'gpt-4o'
  },
  {
    id: 'sagemaker',
    name: 'SageMaker RAG',
    fields: [], // No API key needed - uses EC2 IAM role
    models: [
      {
        id: 'mistral-7b-instruct',
        name: 'Mistral 7B Instruct',
        description: 'Self-hosted Mistral model with optional RAG context'
      }
    ],
    defaultModel: 'mistral-7b-instruct',
    supportsRag: true
  },
  {
    id: 'bedrock',
    name: 'Amazon Bedrock RAG',
    fields: [], // No API key needed - uses IRSA (EKS ServiceAccount)
    models: [
      {
        id: 'anthropic.claude-3-haiku-20240307-v1:0',
        name: 'Claude 3 Haiku',
        description: 'Knowledge Base RAG with Guardrails (ca-central-1)'
      }
    ],
    defaultModel: 'anthropic.claude-3-haiku-20240307-v1:0',
    supportsRag: true
  }
];

export const getProviderById = (id: string): ProviderConfig | undefined => {
  return PROVIDERS.find(p => p.id === id);
};

export const getDefaultProvider = (): ProviderConfig => {
  return PROVIDERS[0];
};
