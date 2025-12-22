import { useSettings } from '../../context/SettingsContext';
import { getProviderById } from '../../config/providers';

export function ModelSelector() {
  const { state, setModel } = useSettings();
  const provider = getProviderById(state.provider);

  if (!provider) return null;

  return (
    <select
      value={state.model}
      onChange={(e) => setModel(e.target.value)}
      className="text-xs bg-transparent text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
      title="Select model"
    >
      {provider.models.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  );
}
