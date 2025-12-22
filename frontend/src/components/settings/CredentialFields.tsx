import { useSettings } from '../../context/SettingsContext';
import { getProviderById } from '../../config/providers';

export function CredentialFields() {
  const { state, setCredential } = useSettings();
  const provider = getProviderById(state.provider);

  if (!provider) {
    return null;
  }

  return (
    <div className="space-y-4">
      {provider.fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <label
            htmlFor={field.key}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            id={field.key}
            type={field.type}
            value={state.credentials[field.key] || ''}
            onChange={(e) => setCredential(field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            required={field.required}
          />
        </div>
      ))}
    </div>
  );
}
