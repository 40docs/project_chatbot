import type { ValidationStatus as ValidationStatusType } from '../../types';

interface ValidationStatusProps {
  status: ValidationStatusType;
  errorMessage?: string | null;
}

export function ValidationStatus({ status, errorMessage }: ValidationStatusProps) {
  if (status === 'idle') {
    return null;
  }

  if (status === 'validating') {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <svg
          className="w-5 h-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm">Validating...</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <span className="text-sm font-medium">Validated</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
        >
          <svg
            className="w-4 h-4"
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
          {errorMessage || 'Validation failed'}
        </button>
      </div>
    );
  }

  return null;
}
