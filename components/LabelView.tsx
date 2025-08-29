import React, { useState } from 'react';
import { Task, Project, Label } from '../types';
import TaskItem from './TaskItem';
import { TagIcon } from './icons/Icons';

interface LabelViewProps {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (taskId: string) => void;
  onDuplicateTask: (id: string) => void;
  hasReportedToday: boolean;
}

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
};

const LabelGroup: React.FC<{
    label: Label | { id: null; name: string; color: string };
    tasks: Task[];
    projects: Project[];
    labels: Label[];
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onSelectTask: (taskId: string) => void;
    onDuplicateTask: (id: string) => void;
    hasReportedToday: boolean;
  }> = ({ label, tasks, projects, labels, onToggleTask, onDeleteTask, onSelectTask, onDuplicateTask, hasReportedToday }) => {
      const [isOpen, setIsOpen] = useState(true);
  
      if (tasks.length === 0) return null;
  
      return (
          <div>
              <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-gray-800/40 rounded-lg text-left hover:bg-gray-800/80 transition">
                  <div className="flex items-center gap-3">
                      <TagIcon className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-lg">{label.name}</h3>
                  </div>
                  <span className="text-sm font-semibold bg-gray-900/60 text-gray-400 px-2.5 py-1 rounded-full">{tasks.length}</span>
              </button>
              {isOpen && (
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-800">
                      {tasks.map(task => {
                          const isLocked = hasReportedToday && task.completed && isToday(new Date(task.createdAt));
                          return (
                              <TaskItem
                                  key={task.id}
                                  task={task}
                                  project={projects.find(p => p.id === task.projectId)}
                                  label={label.id ? label as Label : undefined}
                                  onToggle={onToggleTask}
                                  onDelete={onDeleteTask}
                                  onSelectTask={onSelectTask}
                                  onDuplicate={onDuplicateTask}
                                  isLocked={isLocked}
                              />
                          );
                      })}
                  </div>
              )}
          </div>
      );
  };

const LabelView: React.FC<LabelViewProps> = ({ tasks, projects, labels, onToggleTask, onDeleteTask, onSelectTask, onDuplicateTask, hasReportedToday }) => {
  const tasksByLabel = tasks.reduce((acc, task) => {
    const labelId = task.labelId || 'unassigned';
    if (!acc[labelId]) {
      acc[labelId] = [];
    }
    acc[labelId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-200 border-b-2 border-gray-700 pb-2">라벨별 할 일</h2>
      {labels.map(label => (
        <LabelGroup
            key={label.id}
            label={label}
            tasks={tasksByLabel[label.id] || []}
            projects={projects}
            labels={labels}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onSelectTask={onSelectTask}
            onDuplicateTask={onDuplicateTask}
            hasReportedToday={hasReportedToday}
        />
      ))}
      <LabelGroup
        label={{ id: null, name: '미지정', color: 'bg-gray-500' }}
        tasks={tasksByLabel['unassigned'] || []}
        projects={projects}
        labels={labels}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onSelectTask={onSelectTask}
        onDuplicateTask={onDuplicateTask}
        hasReportedToday={hasReportedToday}
      />
    </div>
  );
};

export default LabelView;