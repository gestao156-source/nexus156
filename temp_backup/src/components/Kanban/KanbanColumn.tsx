import KanbanCard from './KanbanCard';
import { KanbanItem } from '../../types/index';

interface KanbanColumnProps {
  title: string;
  color: string;
  items: KanbanItem[];
  onEdit: (item: KanbanItem) => void;
  onView: (item: KanbanItem) => void;
  getResponsavelName?: (id: string) => string;
}

export default function KanbanColumn({ title, color, items, onEdit, onView, getResponsavelName }: KanbanColumnProps) {
  return (
    <div className={`rounded-xl border-2 ${color} p-4 min-h-[500px]`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="bg-white px-2 py-1 rounded-full text-xs font-semibold text-gray-700">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <KanbanCard 
            key={item.id} 
            item={item} 
            onEdit={onEdit}
            onView={onView}
            responsavelName={getResponsavelName?.(item.responsavel)}
          />
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Nenhum item nesta coluna
          </div>
        )}
      </div>
    </div>
  );
}
