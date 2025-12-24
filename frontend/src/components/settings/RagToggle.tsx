import { useSettings } from '../../context/SettingsContext';
import { getProviderById } from '../../config/providers';

export function RagToggle() {
  const { state, setRagEnabled } = useSettings();

  // Only show for providers that support RAG
  const provider = getProviderById(state.provider);
  if (!provider?.supportsRag) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={state.ragEnabled}
            onChange={(e) => setRagEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
        </div>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Enable RAG Context
        </span>
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 ml-14">
        When enabled, responses include context from indexed documents.
        Disable to use direct LLM without document retrieval.
      </p>
    </div>
  );
}
