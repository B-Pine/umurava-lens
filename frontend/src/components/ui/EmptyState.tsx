interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-secondary text-white rounded-xl font-bold hover:opacity-90 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
