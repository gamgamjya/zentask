import React, { useState } from 'react';
import { Task, Project, Label, User, MonthlyWorkReport } from '../types';
import CalendarDayDetailModal from './CalendarDayDetailModal';
import MonthlyReportModal from './MonthlyReportModal';
import { DocumentTextIcon } from './icons/Icons';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (taskId: string) => void;
  onDuplicateTask: (id: string) => void;
  onAddTask: (content: string, projectId: string | null, labelId: string | null, createdAtDate?: Date) => void;
  onUpdateTaskDate: (taskId: string, newDate: Date) => void;
  hasReportedToday: boolean;
  user: User;
  monthlyReports: MonthlyWorkReport[];
  setMonthlyReports: React.Dispatch<React.SetStateAction<MonthlyWorkReport[]>>;
  showConfirmation: (title: string, message: string, onConfirm: () => void, options?: { variant?: 'danger' | 'primary', confirmText?: string }) => void;
  onCancelMonthlyReportSubmit: (reportId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, projects, labels, onToggleTask, onDeleteTask, onSelectTask, onDuplicateTask, onAddTask, onUpdateTaskDate, hasReportedToday, user, monthlyReports, setMonthlyReports, showConfirmation, onCancelMonthlyReportSubmit }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = Array.from({ length: startDay }, (_, i) => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const getTasksForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate.toDateString() === date.toDateString();
    }).sort((a,b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    });
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: number | null) => {
      if (day) { 
          setSelectedDay(day);
      }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('taskId');
      if(taskId && day) {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        onUpdateTaskDate(taskId, newDate);
      }
  };


  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">
            {currentDate.toLocaleString('ko-KR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">&lt;</button>
            <button onClick={goToToday} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm font-semibold">오늘</button>
            <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">&gt;</button>
          </div>
        </div>
        <button
            onClick={() => setIsMonthlyReportOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors bg-teal-600 hover:bg-teal-700 text-white"
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span>월간 보고</span>
        </button>
      </div>
      <div className="grid grid-cols-7 border-r border-b border-gray-800/60 rounded-lg overflow-hidden">
        {weekDays.map(day => (
          <div key={day} className="text-center font-bold text-gray-400 text-sm py-2 bg-gray-800/40 border-t border-l border-gray-800/60">{day}</div>
        ))}
        {days.map((day, index) => {
          const tasksForDay = day ? getTasksForDay(day) : [];
          const tasksToShow = tasksForDay.slice(0, 3);
          const remainingTasksCount = tasksForDay.length - tasksToShow.length;
          const isToday = day && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
          return (
          <div 
            key={index} 
            onClick={() => handleDayClick(day)} 
            onDragOver={handleDragOver}
            onDrop={(e) => day && handleDrop(e, day)}
            className={`p-2 border-t border-l border-gray-800/60 min-h-[120px] flex flex-col transition-colors ${day ? 'bg-gray-900/20 hover:bg-gray-800/50 cursor-pointer' : 'bg-transparent'}`}>
            {day && (
              <>
                <div className={`font-bold text-sm flex items-center justify-center ${isToday ? 'text-sky-300' : 'text-gray-400'}`}>
                    <span className={isToday ? 'w-7 h-7 flex items-center justify-center border-2 border-sky-400 rounded-full' : ''}>
                        {day}
                    </span>
                </div>
                <div className="mt-1 space-y-1 flex-grow">
                  {tasksToShow.map(task => {
                    const project = projects.find(p=>p.id === task.projectId);
                    const borderColor = project ? project.color.replace('bg-', 'border-') : 'border-gray-400';
                    return (
                        <div 
                            key={task.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className={`text-xs p-1.5 rounded-md bg-gray-700/70 truncate cursor-grab ${task.completed ? 'opacity-50 line-through' : ''} border-l-2 ${borderColor}`} title={task.content}>
                            {task.content}
                        </div>
                    );
                  })}
                </div>
                {remainingTasksCount > 0 && (
                     <div className="text-xs text-center text-sky-400 font-semibold mt-1">
                        +{remainingTasksCount} 더보기
                    </div>
                )}
              </>
            )}
          </div>
        )})}
      </div>
      {selectedDay && (
          <CalendarDayDetailModal 
            date={new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay)}
            tasks={getTasksForDay(selectedDay)}
            projects={projects}
            labels={labels}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onSelectTask={onSelectTask}
            onDuplicateTask={onDuplicateTask}
            onAddTask={onAddTask}
            onClose={() => setSelectedDay(null)}
            hasReportedToday={hasReportedToday}
          />
      )}
      {isMonthlyReportOpen && (
        <MonthlyReportModal
          isOpen={isMonthlyReportOpen}
          onClose={() => setIsMonthlyReportOpen(false)}
          user={user}
          tasks={tasks}
          projects={projects}
          labels={labels}
          currentDate={currentDate}
          monthlyReports={monthlyReports}
          setMonthlyReports={setMonthlyReports}
          showConfirmation={showConfirmation}
          onCancelSubmit={onCancelMonthlyReportSubmit}
        />
      )}
    </div>
  );
};

export default CalendarView;