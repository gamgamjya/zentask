import React from 'react';
import { Task, Project, Label } from '../types';
import TaskItem from './TaskItem';
import { ArrowUpTrayIcon, ReplyIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons/Icons';

interface DashboardViewProps {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (taskId: string) => void;
  onDuplicateTask: (id: string) => void;
  hasReportedToday: boolean;
  onReport: () => void;
  onCancelReport: () => void;
}

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
};

const isPast = (someDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(someDate);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  projects,
  labels,
  onToggleTask,
  onDeleteTask,
  onSelectTask,
  onDuplicateTask,
  hasReportedToday,
  onReport,
  onCancelReport,
}) => {
    const todayTasks = tasks.filter(task => isToday(new Date(task.createdAt)))
        .sort((a,b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
    const overdueTasks = tasks.filter(task => !task.completed && isPast(new Date(task.createdAt)))
         .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                <div>
                    <h2 className="text-2xl font-bold text-gray-200">오늘의 할 일</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    </p>
                </div>
                {hasReportedToday ? (
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>업무 보고 완료</span>
                        </span>
                        <button 
                            onClick={onCancelReport}
                            className="flex items-center gap-2 text-sm bg-amber-600 hover:bg-amber-700 text-white font-semibold py-1.5 px-3 rounded-lg transition-colors"
                        >
                            <ReplyIcon className="w-4 h-4" />
                            <span>보고 취소</span>
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={onReport}
                        className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        <ArrowUpTrayIcon className="w-5 h-5" />
                        <span>일일 보고 및 퇴근</span>
                    </button>
                )}
            </div>
            
            {overdueTasks.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        기한이 지난 할 일
                    </h3>
                    <div className="space-y-2">
                        {overdueTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                project={projects.find(p => p.id === task.projectId)}
                                label={labels.find(l => l.id === task.labelId)}
                                onToggle={onToggleTask}
                                onDelete={onDeleteTask}
                                onSelectTask={onSelectTask}
                                onDuplicate={onDuplicateTask}
                                isLocked={false}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            <div>
                 <h3 className="text-xl font-bold text-gray-300 mb-4">오늘의 할 일 목록 ({todayTasks.length})</h3>
                {todayTasks.length > 0 ? (
                    <div className="space-y-2">
                        {todayTasks.map(task => {
                            const isLocked = hasReportedToday && task.completed;
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
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-900/30 rounded-lg">
                        <p className="text-gray-500">오늘 등록된 할 일이 없습니다.</p>
                        <p className="text-sm text-gray-600 mt-2">상단의 입력창에 새 할 일을 추가해보세요!</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default DashboardView;
