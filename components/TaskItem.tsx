import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Task, Project, Label } from '../types';
import { TrashIcon, PencilIcon, CheckIcon, XIcon, DuplicateIcon } from './icons/Icons';

interface TaskItemProps {
  task: Task;
  project: Project | undefined;
  label: Label | undefined;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectTask: (taskId: string) => void;
  onDuplicate: (id: string) => void;
  isLocked?: boolean;
  showStrikethroughOnComplete?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, project, label, onToggle, onDelete, onSelectTask, onDuplicate, isLocked = false, showStrikethroughOnComplete = true }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const portalRoot = document.getElementById('portal-root');
  
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('close-all-context-menus', closeMenu);
    return () => {
      window.removeEventListener('close-all-context-menus', closeMenu);
    };
  }, []);
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    window.dispatchEvent(new CustomEvent('close-all-context-menus'));
    
    const menuWidth = 130;
    const menuHeight = 110;

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
        x = e.clientX - menuWidth;
    }

    if (y + menuHeight > window.innerHeight) {
        y = e.clientY - menuHeight;
    }
    
    setContextMenu({ x, y });
  };
  
  const startEdit = () => {
    onSelectTask(task.id);
    setContextMenu(null);
  };
  
  const handleDelete = () => {
    onDelete(task.id);
    setContextMenu(null);
  };
  
  const handleDuplicate = () => {
    onDuplicate(task.id);
    setContextMenu(null);
  };
  
  const itemClasses = [
    'flex items-center gap-4 p-3 rounded-lg transition-all duration-200 border',
    isLocked 
        ? 'bg-gray-900/50 opacity-60 cursor-not-allowed border-transparent'
        : task.completed
            ? 'bg-gray-800/20 opacity-50 border-transparent'
            : 'bg-gray-800/60 hover:bg-gray-800 border-transparent hover:border-sky-500/30 cursor-pointer'
  ].join(' ');

  const contentClasses = `flex-grow ${task.completed ? `text-gray-500 ${showStrikethroughOnComplete ? 'line-through' : ''}` : 'text-gray-200'}`;

  return (
    <>
      <div 
        onClick={() => !isLocked && onSelectTask(task.id)}
        onContextMenu={isLocked ? (e) => e.preventDefault() : handleContextMenu}
        title={isLocked ? '보고를 취소한 후에만 수정/변경할 수 있습니다.' : ''}
        className={itemClasses}>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={task.completed}
            disabled={isLocked}
            onChange={() => onToggle(task.id)}
            className={`form-checkbox h-5 w-5 rounded-md bg-gray-700 border-gray-600 text-sky-500 focus:ring-sky-500 flex-shrink-0 ${ isLocked ? 'cursor-not-allowed' : 'cursor-pointer' }`}
          />
        </div>
        <span className={contentClasses}>
          {task.content}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {project && (
            <span className={`text-xs font-semibold px-2 py-1 ${project.color} text-white rounded-full`}>
              #{project.name}
            </span>
          )}
          {label && (
            <span className={`text-xs font-semibold px-2 py-1 ${label.color} text-white rounded-full`}>
              @{label.name}
            </span>
          )}
        </div>
      </div>
      {contextMenu && portalRoot && createPortal(
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-gray-950/70 backdrop-blur-md border border-gray-700 rounded-md shadow-lg py-1 text-sm animate-fade-in-fast"
        >
          <button onClick={startEdit} className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center gap-2">
            <PencilIcon className="w-4 h-4" /> 수정
          </button>
          <button onClick={handleDuplicate} className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center gap-2">
            <DuplicateIcon className="w-4 h-4" /> 복제
          </button>
          <button onClick={handleDelete} className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center gap-2 text-red-400">
            <TrashIcon className="w-4 h-4" /> 삭제
          </button>
        </div>,
        portalRoot
      )}
    </>
  );
};

export default TaskItem;