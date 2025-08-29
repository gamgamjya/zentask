import React from 'react';
import { Task, Project, Label } from '../types';
import TaskItem from './TaskItem';
import { XIcon } from './icons/Icons';
import TaskInput from './TaskInput';

interface ModalProps {
    date: Date;
    tasks: Task[];
    projects: Project[];
    labels: Label[];
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onSelectTask: (taskId: string) => void;
    onDuplicateTask: (id: string) => void;
    onAddTask: (content: string, projectId: string | null, labelId: string | null, createdAtDate?: Date) => void;
    onClose: () => void;
    hasReportedToday: boolean;
}

const CalendarDayDetailModal: React.FC<ModalProps> = ({ date, tasks, projects, labels, onToggleTask, onDeleteTask, onSelectTask, onDuplicateTask, onAddTask, onClose, hasReportedToday }) => {

    const handleAddTaskFromInput = (content: string, projectId: string | null, labelId: string | null) => {
        if (content) {
            onAddTask(content, projectId, labelId, date);
        }
    };
    
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const isModalForToday = new Date().toDateString() === date.toDateString();

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl w-full max-w-2xl p-6 m-4 max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-sky-300">
                        {date.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    </h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full transition-colors">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                    {sortedTasks.length > 0 ? (
                        sortedTasks.map(task => {
                            const isLocked = hasReportedToday && isModalForToday && task.completed;
                            return (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    project={projects.find(p => p.id === task.projectId)}
                                    label={labels.find(l => l.id === task.labelId)}
                                    onToggle={onToggleTask}
                                    onDelete={onDeleteTask}
                                    onSelectTask={onSelectTask}
                                    onDuplicate={onDuplicateTask}
                                    isLocked={isLocked}
                                    showStrikethroughOnComplete={true}
                                />
                            );
                        })
                    ) : (
                        <p className="text-gray-500 text-center py-8">이 날짜에 할 일이 없습니다.</p>
                    )}
                </div>
                <div className="flex-shrink-0 pt-4 border-t border-gray-700">
                    <TaskInput
                        onAddTask={handleAddTaskFromInput}
                        projects={projects}
                        labels={labels}
                    />
                </div>
            </div>
        </div>
    );
}

export default CalendarDayDetailModal;