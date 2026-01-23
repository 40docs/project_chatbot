import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ValidationStatus } from '../types';
import { getDefaultProvider, getProviderById } from '../config/providers';

interface SettingsState {
  provider: string;
  model: string;
  credentials: Record<string, string>;
  validationStatus: ValidationStatus;
  validationError: string | null;
  isSettingsOpen: boolean;
  ragEnabled: boolean;
}

type SettingsAction =
  | { type: 'SET_PROVIDER'; payload: string }
  | { type: 'SET_MODEL'; payload: string }
  | { type: 'SET_CREDENTIAL'; payload: { key: string; value: string } }
  | { type: 'SET_CREDENTIALS'; payload: Record<string, string> }
  | { type: 'SET_VALIDATION_STATUS'; payload: ValidationStatus }
  | { type: 'SET_VALIDATION_ERROR'; payload: string | null }
  | { type: 'TOGGLE_SETTINGS'; payload?: boolean }
  | { type: 'RESET_VALIDATION' }
  | { type: 'SET_RAG_ENABLED'; payload: boolean };

const STORAGE_KEY = 'llm-portal-settings';

function loadStoredSettings(): Partial<SettingsState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        provider: parsed.provider,
        model: parsed.model,
        credentials: parsed.credentials || {},
        ragEnabled: parsed.ragEnabled !== undefined ? parsed.ragEnabled : true
      };
    }
  } catch {
    // Ignore storage errors
  }
  return {};
}

function saveSettings(provider: string, model: string, credentials: Record<string, string>, ragEnabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, model, credentials, ragEnabled }));
  } catch {
    // Ignore storage errors
  }
}

const storedSettings = loadStoredSettings();
const defaultProvider = getDefaultProvider();

// Determine initial validation status based on provider type
function getInitialValidationStatus(): ValidationStatus {
  const provider = storedSettings.provider || defaultProvider.id;
  // SageMaker uses IAM, so if it was previously validated, restore that status
  if (provider === 'sagemaker') {
    // Check if SageMaker was previously validated (stored in localStorage)
    return storedSettings.credentials !== undefined ? 'success' : 'idle';
  }
  // Other providers require stored credentials
  return storedSettings.credentials && Object.keys(storedSettings.credentials).length > 0 ? 'success' : 'idle';
}

const initialState: SettingsState = {
  provider: storedSettings.provider || defaultProvider.id,
  model: storedSettings.model || defaultProvider.defaultModel,
  credentials: storedSettings.credentials || {},
  validationStatus: getInitialValidationStatus(),
  validationError: null,
  isSettingsOpen: false,
  ragEnabled: storedSettings.ragEnabled !== undefined ? storedSettings.ragEnabled : true
};

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_PROVIDER': {
      const newProvider = getProviderById(action.payload);
      return {
        ...state,
        provider: action.payload,
        model: newProvider?.defaultModel || '',
        credentials: {},
        validationStatus: 'idle',
        validationError: null
      };
    }

    case 'SET_MODEL':
      return {
        ...state,
        model: action.payload
      };

    case 'SET_CREDENTIAL':
      return {
        ...state,
        credentials: {
          ...state.credentials,
          [action.payload.key]: action.payload.value
        }
      };

    case 'SET_CREDENTIALS':
      return {
        ...state,
        credentials: action.payload
      };

    case 'SET_VALIDATION_STATUS':
      return {
        ...state,
        validationStatus: action.payload
      };

    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validationError: action.payload
      };

    case 'TOGGLE_SETTINGS':
      return {
        ...state,
        isSettingsOpen: action.payload !== undefined ? action.payload : !state.isSettingsOpen
      };

    case 'RESET_VALIDATION':
      return {
        ...state,
        validationStatus: 'idle',
        validationError: null
      };

    case 'SET_RAG_ENABLED':
      return {
        ...state,
        ragEnabled: action.payload
      };

    default:
      return state;
  }
}

interface SettingsContextValue {
  state: SettingsState;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setCredential: (key: string, value: string) => void;
  setValidationStatus: (status: ValidationStatus) => void;
  setValidationError: (error: string | null) => void;
  toggleSettings: (open?: boolean) => void;
  resetValidation: () => void;
  saveCredentials: () => void;
  hasValidCredentials: () => boolean;
  setRagEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  const setProvider = (provider: string) => {
    dispatch({ type: 'SET_PROVIDER', payload: provider });
  };

  const setModel = (model: string) => {
    dispatch({ type: 'SET_MODEL', payload: model });
  };

  const setCredential = (key: string, value: string) => {
    dispatch({ type: 'SET_CREDENTIAL', payload: { key, value } });
  };

  const setValidationStatus = (status: ValidationStatus) => {
    dispatch({ type: 'SET_VALIDATION_STATUS', payload: status });
  };

  const setValidationError = (error: string | null) => {
    dispatch({ type: 'SET_VALIDATION_ERROR', payload: error });
  };

  const toggleSettings = (open?: boolean) => {
    dispatch({ type: 'TOGGLE_SETTINGS', payload: open });
  };

  const resetValidation = () => {
    dispatch({ type: 'RESET_VALIDATION' });
  };

  const setRagEnabled = (enabled: boolean) => {
    dispatch({ type: 'SET_RAG_ENABLED', payload: enabled });
  };

  const saveCredentials = () => {
    saveSettings(state.provider, state.model, state.credentials, state.ragEnabled);
  };

  const hasValidCredentials = () => {
    // SageMaker and Bedrock don't require credentials (use IAM role / IRSA)
    if (state.provider === 'sagemaker' || state.provider === 'bedrock') {
      return state.validationStatus === 'success';
    }
    return state.validationStatus === 'success' && Object.keys(state.credentials).length > 0;
  };

  // Save to localStorage when credentials are validated or RAG setting changes
  useEffect(() => {
    if (state.validationStatus === 'success') {
      saveSettings(state.provider, state.model, state.credentials, state.ragEnabled);
    }
  }, [state.validationStatus, state.provider, state.model, state.credentials, state.ragEnabled]);

  return (
    <SettingsContext.Provider
      value={{
        state,
        setProvider,
        setModel,
        setCredential,
        setValidationStatus,
        setValidationError,
        toggleSettings,
        resetValidation,
        saveCredentials,
        hasValidCredentials,
        setRagEnabled
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
