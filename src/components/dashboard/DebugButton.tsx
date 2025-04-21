
interface DebugButtonProps {
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
  tenderCount: number;
}

export const DebugButton = ({ showDebugInfo, setShowDebugInfo, tenderCount }: DebugButtonProps) => {
  if (tenderCount === 0 || showDebugInfo) {
    return (
      <button 
        onClick={() => setShowDebugInfo(!showDebugInfo)}
        className="text-xs text-gray-500 hover:text-gray-700 mt-2 underline"
      >
        {showDebugInfo ? "Hide Diagnostics" : "Show Advanced Diagnostics"}
      </button>
    );
  }
  return null;
};
