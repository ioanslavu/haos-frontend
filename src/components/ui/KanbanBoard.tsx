/**
 * Generic KanbanBoard Component
 *
 * A reusable drag-and-drop kanban board that works with any data type.
 * Supports customizable columns, card rendering, and status updates.
 *
 * @example
 * ```tsx
 * <KanbanBoard
 *   columns={[
 *     { id: 'todo', label: 'To Do', color: 'bg-gray-500' },
 *     { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
 *   ]}
 *   itemsByColumn={{
 *     todo: [task1, task2],
 *     in_progress: [task3],
 *   }}
 *   renderCard={(item, isDragging) => <TaskCard task={item} />}
 *   renderDragOverlay={(item) => <TaskCard task={item} />}
 *   onItemClick={(item) => console.log('clicked', item)}
 *   onStatusChange={(itemId, newStatus) => updateStatus(itemId, newStatus)}
 *   getItemId={(item) => item.id}
 * />
 * ```
 */

import { ReactNode, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface KanbanColumn {
  id: string;
  label: string;
  color?: string;
}

export interface KanbanBoardProps<T> {
  /** Column definitions */
  columns: KanbanColumn[];

  /** Items grouped by column ID */
  itemsByColumn: Record<string, T[]>;

  /** Render function for each card */
  renderCard: (item: T, isDragging: boolean) => ReactNode;

  /** Render function for drag overlay (optional, defaults to renderCard) */
  renderDragOverlay?: (item: T) => ReactNode;

  /** Click handler for items */
  onItemClick?: (item: T) => void;

  /** Callback when item is dragged to a new column */
  onStatusChange?: (itemId: string | number, newStatus: string) => void | Promise<void>;

  /** Function to get unique ID from item */
  getItemId: (item: T) => string | number;

  /** Optional: Column height (default: 700px) */
  columnHeight?: string;

  /** Optional: Custom column header renderer */
  renderColumnHeader?: (column: KanbanColumn, count: number) => ReactNode;
}

/**
 * Droppable Column Component - Internal
 */
function DroppableColumn({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors rounded-lg',
        isOver && 'bg-primary/5 ring-2 ring-primary/50'
      )}
    >
      {children}
    </div>
  );
}

/**
 * Draggable Card Component - Internal
 */
function DraggableCard<T>({
  id,
  children,
  onClick
}: {
  id: string | number;
  children: ReactNode;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id.toString(),
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(isDragging && 'opacity-30')}
      onClick={(e) => {
        if (!isDragging) {
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

/**
 * Generic KanbanBoard Component
 */
export function KanbanBoard<T>({
  columns,
  itemsByColumn,
  renderCard,
  renderDragOverlay,
  onItemClick,
  onStatusChange,
  getItemId,
  columnHeight = '700px',
  renderColumnHeader,
}: KanbanBoardProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start dragging
      },
    })
  );

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const itemId = event.active.id;

    // Find the item across all columns
    let foundItem: T | null = null;
    for (const columnItems of Object.values(itemsByColumn)) {
      const item = columnItems.find((i) => getItemId(i).toString() === itemId);
      if (item) {
        foundItem = item;
        break;
      }
    }

    if (foundItem) {
      setActiveItem(foundItem);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveItem(null);
      return;
    }

    const itemId = active.id;
    const newStatus = over.id as string;

    // Call the status change callback
    if (onStatusChange) {
      await onStatusChange(itemId, newStatus);
    }

    setActiveItem(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={cn("grid gap-8", `grid-cols-${columns.length}`)}>
        {columns.map((column) => {
          const columnItems = itemsByColumn[column.id] || [];

          return (
            <DroppableColumn key={column.id} id={column.id}>
              <div className="flex flex-col" style={{ height: columnHeight }}>
                {/* Column Header */}
                <div className="pb-5 mb-4">
                  {renderColumnHeader ? (
                    renderColumnHeader(column, columnItems.length)
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {column.color && (
                          <div className={cn("w-3 h-3 rounded-full", column.color)} />
                        )}
                        <h3 className="text-base font-semibold">{column.label}</h3>
                      </div>
                      <Badge variant="secondary" className="text-sm px-2.5 py-1 font-medium">
                        {columnItems.length}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Scrollable Cards Container */}
                <div className="flex-1 overflow-auto">
                  <div className="space-y-4 pr-2">
                    {columnItems.map((item) => {
                      const itemId = getItemId(item);
                      const isDragging = activeItem && getItemId(activeItem) === itemId;

                      return (
                        <DraggableCard
                          key={itemId}
                          id={itemId}
                          onClick={() => onItemClick?.(item)}
                        >
                          {renderCard(item, !!isDragging)}
                        </DraggableCard>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DroppableColumn>
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeItem ? (
          renderDragOverlay ? renderDragOverlay(activeItem) : renderCard(activeItem, false)
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
