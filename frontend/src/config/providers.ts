import type { ProviderConfig } from '../types';

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true }
    ]
  }
];

export const getProviderById = (id: string): ProviderConfig | undefined => {
  return PROVIDERS.find(p => p.id === id);
};

export const getDefaultProvider = (): ProviderConfig => {
  return PROVIDERS[0];
};
