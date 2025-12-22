import type { ValidationResult, Conversation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function validateCredentials(
  provider: string,
  credentials: Record<string, string>
): Promise<ValidationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/validate/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credentials }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        valid: false,
        provider,
        error: {
          code: data.error?.code || `HTTP_${response.status}`,
          message: data.error?.message || data.detail || 'Validation failed',
        },
      };
    }

    return data as ValidationResult;
  } catch (error) {
    // If backend is unavailable, simulate validation for development
    console.warn('Backend unavailable, using mock validation:', error);
    return mockValidateCredentials(provider, credentials);
  }
}

// Mock validation for development when backend is unavailable
function mockValidateCredentials(
  provider: string,
  credentials: Record<string, string>
): ValidationResult {
  // Simulate API key validation
  const apiKey = credentials.apiKey || '';

  if (!apiKey) {
    return {
      valid: false,
      provider,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required',
      },
    };
  }

  // Anthropic API keys start with 'sk-ant-'
  if (provider === 'anthropic') {
    if (apiKey.startsWith('sk-ant-') && apiKey.length > 20) {
      return { valid: true, provider };
    }
    return {
      valid: false,
      provider,
      error: {
        code: 'invalid_api_key',
        message: 'Invalid API key format. Anthropic keys start with sk-ant-',
      },
    };
  }

  // OpenAI API keys start with 'sk-'
  if (provider === 'openai') {
    if (apiKey.startsWith('sk-') && apiKey.length > 20) {
      return { valid: true, provider };
    }
    return {
      valid: false,
      provider,
      error: {
        code: 'invalid_api_key',
        message: 'Invalid API key format. OpenAI keys start with sk-',
      },
    };
  }

  // Default: accept any key with sufficient length
  if (apiKey.length > 10) {
    return { valid: true, provider };
  }

  return {
    valid: false,
    provider,
    error: {
      code: 'invalid_api_key',
      message: 'API key appears to be invalid',
    },
  };
}

export async function sendMessage(
  conversationId: string,
  message: string,
  provider: string,
  credentials: Record<string, string>,
  model: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        message,
        provider,
        credentials,
        model,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send message');
    }

    // Handle SSE streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Parse SSE data
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch {
            // If not JSON, treat as plain text
            onChunk(data);
          }
        }
      }
    }
  } catch (error) {
    // If backend is unavailable, use mock response
    console.warn('Backend unavailable, using mock response:', error);
    await mockSendMessage(message, onChunk);
  }
}

// Mock message sending for development
async function mockSendMessage(
  message: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const responses = [
    "I'm a mock AI assistant running in development mode. ",
    "The backend server isn't connected, so I'm simulating responses. ",
    `You asked: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"\n\n`,
    "Once the backend is running, you'll get real AI responses from your configured provider.",
  ];

  for (const response of responses) {
    for (const char of response) {
      onChunk(char);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations`);

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    return await response.json();
  } catch (error) {
    // Return empty array if backend unavailable
    console.warn('Backend unavailable, returning empty conversations:', error);
    return [];
  }
}
