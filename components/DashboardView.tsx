import React from 'react';
import { Task, Project, Label } from '../types';
import TaskItem from './TaskItem';
import { ArrowUpTrayIcon, CheckCircleIcon, SparklesIcon, CalendarIcon, ArchiveBoxIcon, ExclamationTriangleIcon } from './icons/Icons';

interface DashboardViewProps {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (taskId: string) => void;
  onDuplicateTask: (id: string) => void;
  onReport: () => void;
  onCancelReport: () => void;
  hasReportedToday: boolean;
}

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
};

const isBeforeToday = (someDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(someDate);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
};

const StatsCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className={`bg-gray-900/50 border ${color} p-4 rounded-xl flex items-center gap-4`}>
        <div className={`p-3 rounded-full bg-gray-800`}>
            {icon}
        </div>
        <div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm font-semibold text-gray-400">{title}</div>
        </div>
    </div>
);


const DashboardView: React.FC<DashboardViewProps> = (props) => {
  const { tasks, projects, labels, onToggleTask, onDeleteTask, onSelectTask, onDuplicateTask, onReport, onCancelReport, hasReportedToday } = props;

  const todaysTasks = tasks.filter(task => isToday(new Date(task.createdAt)));
  const incompleteToday = todaysTasks.filter(task => !task.completed);
  const completedToday = todaysTasks.filter(task => task.completed);
  
  const overdueTasks = tasks.filter(task => !task.completed && isBeforeToday(new Date(task.createdAt)));

  return (
    <div className="animate-slide-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatsCard 
              title="오늘 할 일" 
              value={incompleteToday.length} 
              icon={<CalendarIcon className="w-6 h-6 text-sky-400" />} 
              color="border-sky-500/30"
          />
          <StatsCard 
              title="완료한 일" 
              value={completedToday.length} 
              icon={<CheckCircleIcon className="w-6 h-6 text-emerald-400" />}
              color="border-emerald-500/30"
          />
          <StatsCard 
              title="밀린 일" 
              value={overdueTasks.length} 
              icon={<ExclamationTriangleIcon className="w-6 h-6 text-amber-400" />}
              color="border-amber-500/30"
          />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800/50">
          <h3 className="text-xl font-semibold mb-4 text-sky-400 pb-2 border-b border-gray-800">오늘 할 일 ({incompleteToday.length})</h3>
          <div className="space-y-2 mt-4">
            {incompleteToday.length > 0 ? (
              incompleteToday.map(task => (
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
              ))
            ) : (
              <div className="text-center py-10 px-4 bg-gray-800/30 border border-transparent rounded-lg flex flex-col items-center gap-3">
                <SparklesIcon className="w-10 h-10 text-sky-400" />
                <p className="text-gray-400">오늘 할 일이 없습니다! 👍</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800/50">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
              <h3 className="text-xl font-semibold text-emerald-400">오늘 완료한 일 ({completedToday.length})</h3>
              {hasReportedToday ? (
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                        <CheckCircleIcon className="w-5 h-5" />
                        보고 완료
                    </span>
                    <button
                        onClick={onCancelReport}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-full px-2 py-1 transition-colors"
                        aria-label="보고 취소"
                    >
                        취소
                    </button>
                </div>
              ) : (
                <button
                    onClick={onReport}
                    className="flex items-center gap-2 text-sm font-semibold rounded-full px-3 py-1 transition-colors bg-sky-500 hover:bg-sky-600 text-white"
                >
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    <span>일일 보고</span>
                </button>
              )}
            </div>
            <div className="space-y-2 mt-4">
              {completedToday.length > 0 ? (
                completedToday.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    project={projects.find(p => p.id === task.projectId)}
                    label={labels.find(l => l.id === task.labelId)}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    onSelectTask={onSelectTask}
                    onDuplicate={onDuplicateTask}
                    isLocked={hasReportedToday}
                    showStrikethroughOnComplete={false}
                  />
                ))
              ) : (
                  <div className="text-center py-10 px-4 bg-gray-800/30 border border-transparent rounded-lg">
                      <p className="text-gray-400">오늘 완료한 일이 아직 없습니다.</p>
                  </div>
              )}
            </div>
        </div>
      </div>
      
      {overdueTasks.length > 0 && (
        <div className="mt-8 bg-gray-900/50 p-6 rounded-xl border border-gray-800/50">
          <h3 className="text-xl font-semibold mb-4 text-amber-400 pb-2 border-b border-gray-800">밀린 할 일 ({overdueTasks.length})</h3>
          <div className="space-y-2 mt-4">
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
    </div>
  );
};

export default DashboardView;