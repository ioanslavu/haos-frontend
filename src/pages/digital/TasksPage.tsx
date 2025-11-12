import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * This page has been merged with /task-management
 *
 * All features have been ported to the unified task management page:
 * - TaskViewSheet (right-side detail modal)
 * - Drag-and-drop kanban functionality
 * - Employee filter for managers
 * - Advanced filters (date range, priority)
 *
 * Redirecting to /task-management
 */
export default function DigitalTasksPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/task-management', { replace: true });
  }, [navigate]);

  return null;
}
