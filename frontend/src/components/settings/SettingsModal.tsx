import type { FormEvent } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { ProviderSelect } from './ProviderSelect';
import { CredentialFields } from './CredentialFields';
import { ValidationStatus } from './ValidationStatus';
import { validateCredentials } from '../../services/api';
import { getProviderById } from '../../config/providers';

export function SettingsModal() {
  const {
    state,
    toggleSettings,
    setValidationStatus,
    setValidationError,
    resetValidation
  } = useSettings();

  if (!state.isSettingsOpen) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const provider = getProviderById(state.provider);
    if (!provider) return;

    // Check all required fields are filled
    const missingFields = provider.fields
      .filter(f => f.required && !state.credentials[f.key])
      .map(f => f.label);

    if (missingFields.length > 0) {
      setValidationStatus('error');
      setValidationError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    setValidationStatus('validating');
    setValidationError(null);

    try {
      const result = await validateCredentials(state.provider, state.credentials);

      if (result.valid) {
        setValidationStatus('success');
        setValidationError(null);
      } else {
        setValidationStatus('error');
        setValidationError(result.error?.message || `Error: ${result.error?.code || 'Unknown error'}`);
      }
    } catch (error) {
      setValidationStatus('error');
      setValidationError(error instanceof Error ? error.message : 'Validation failed');
    }
  };

  const handleClose = () => {
    toggleSettings(false);
    // Only reset validation if not successful
    if (state.validationStatus !== 'success') {
      resetValidation();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <ProviderSelect />
          <CredentialFields />

          {/* Submit and Status */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="submit"
              disabled={state.validationStatus === 'validating'}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {state.validationStatus === 'validating' ? 'Validating...' : 'Submit'}
            </button>

            <ValidationStatus
              status={state.validationStatus}
              errorMessage={state.validationError}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
