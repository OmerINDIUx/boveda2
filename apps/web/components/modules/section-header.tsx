import { Plus } from 'lucide-react';
import { Button } from '../ui/button';

export function SectionHeader({
  title,
  description,
  action,
  actionHref,
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action ? (
        onAction ? (
          <Button variant="primary" onClick={onAction} iconLeft={<Plus size={18} />}>
            {action}
          </Button>
        ) : (
          <a href={actionHref || '#'}>
            <Button variant="primary" iconLeft={<Plus size={18} />}>
              {action}
            </Button>
          </a>
        )
      ) : null}
    </div>
  );
}
