import { Plus } from 'lucide-react';

export function SectionHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action ? (
        <button className="button" type="button">
          <Plus size={18} />
          {action}
        </button>
      ) : null}
    </div>
  );
}
