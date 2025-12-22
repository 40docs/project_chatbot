import { useSettings } from '../../context/SettingsContext';
import { PROVIDERS } from '../../config/providers';

export function ProviderSelect() {
  const { state, setProvider } = useSettings();

  return (
    <div className="space-y-2">
      <label htmlFor="provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Provider
      </label>
      <select
        id="provider"
        value={state.provider}
        onChange={(e) => setProvider(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
      >
        {PROVIDERS.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
    </div>
  );
}
