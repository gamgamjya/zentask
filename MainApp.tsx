import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Task, Project, Label, View, User, DailyReport, MonthlyWorkReport } from './types';
import Header from './components/Header';
import ProjectView from './components/ProjectView';
import LabelView from './components/LabelView';
import CalendarView from './components/CalendarView';
import DashboardView from './components/DashboardView';
import ProjectAndLabelManagement from './components/ProjectAndLabelManagement';
import TaskDetailModal from './components/TaskDetailModal';
import ExportView from './components/ExportView';
import { XIcon } from './components/icons/Icons';

const DEFAULT_PROJECTS: Project[] = [
  { id: 'proj-1', name: '업무', color: 'bg-sky-500' },
  { id: 'proj-2', name: '개인', color: 'bg-emerald-500' },
  { id: 'proj-3', name: '공부', color: 'bg-amber-500' },
];

const DEFAULT_LABELS: Label[] = [
  { id: 'lab-1', name: '긴급', color: 'bg-red-500', projectId: null },
  { id: 'lab-2', name: '중요', color: 'bg-indigo-500', projectId: null },
  { id: 'lab-3', name: '자투리', color: 'bg-pink-500', projectId: null },
];

// Notification Component
const Notification: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    const bgColor = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        info: 'bg-sky-500',
    }[type];

    return (
        <div className={`${bgColor} text-white rounded-lg shadow-lg p-4 flex items-center justify-between animate-fade-in-fast border border-white/10`}>
            <span>{message}</span>
            <button onClick={onDismiss} className="ml-4 -mr-2 p-1 rounded-full hover:bg-black/20 transition-colors">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// Confirmation Modal Component
const ConfirmationModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmButtonVariant?: 'danger' | 'primary';
    confirmButtonText?: string;
}> = ({ isOpen, title, message, onConfirm, onCancel, confirmButtonVariant = 'danger', confirmButtonText = '확인' }) => {
    if (!isOpen) return null;

    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    const buttonClass = confirmButtonVariant === 'danger'
        ? "bg-red-600 hover:bg-red-700"
        : "bg-sky-600 hover:bg-sky-700";

    return createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in" onClick={onCancel}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-200 mb-2">{title}</h3>
                <p className="text-gray-400 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${buttonClass}`}
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>,
        portalRoot
    );
};


interface MainAppProps {
  user: User;
  onLogout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const calculateNextDate = (currentDate: Date, repeat: Task['repeat']) => {
    const nextDate = new Date(currentDate);
    nextDate.setHours(12, 0, 0, 0); // Normalize time to avoid DST issues
    switch (repeat) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekdays':
            let day = nextDate.getDay(); // 0 = Sunday, 6 = Saturday
            nextDate.setDate(nextDate.getDate() + 1); // Always move to next day first
            day = nextDate.getDay();
            if (day === 6) { // Saturday
                nextDate.setDate(nextDate.getDate() + 2);
            } else if (day === 0) { // Sunday
                nextDate.setDate(nextDate.getDate() + 1);
            }
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }
    return nextDate;
};


const MainApp: React.FC<MainAppProps> = ({ user, onLogout, setUser, allUsers, setAllUsers }) => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', DEFAULT_PROJECTS);
  const [labels, setLabels] = useLocalStorage<Label[]>('labels', DEFAULT_LABELS);
  const [view, setView] = useState<View>('dashboard');
  const [dailyReports, setDailyReports] = useLocalStorage<DailyReport[]>('dailyReports', []);
  const [monthlyReports, setMonthlyReports] = useLocalStorage<MonthlyWorkReport[]>('monthlyReports', []);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmButtonVariant?: 'danger' | 'primary';
    confirmButtonText?: string;
  }
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  interface NotificationState {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  }
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const portalRoot = document.getElementById('portal-root');

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => {
      setNotifications(n => n.filter(notif => notif.id !== id));
    }, 4000);
  };

  const showConfirmation = (title: string, message: string, onConfirmAction: () => void, options: { variant?: 'danger' | 'primary', confirmText?: string } = {}) => {
    const { variant = 'danger', confirmText = '확인' } = options;
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      },
      confirmButtonVariant: variant,
      confirmButtonText: confirmText,
    });
  };

  const handleCancelConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };


  useEffect(() => {
    const handleInteraction = () => {
      window.dispatchEvent(new CustomEvent('close-all-context-menus'));
    };

    document.addEventListener('click', handleInteraction);
    window.addEventListener('scroll', handleInteraction, true);

    return () => {
      document.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction, true);
    };
  }, []);

  useEffect(() => {
    if ((view === 'tasks' || view === 'export') && !user.isAdmin) {
        // Allow export for non-admins
        if (view === 'tasks') setView('dashboard');
    }
  }, [view, user.isAdmin]);
  
  useEffect(() => {
    const currentUserInList = allUsers.find(u => u.id === user.id);
    if (currentUserInList && JSON.stringify(currentUserInList) !== JSON.stringify(user)) {
      setUser(currentUserInList);
    }
  }, [allUsers, user, setUser]);

  useEffect(() => {
    const projectIds = new Set(projects.map(p => p.id));
    const labelIds = new Set(labels.map(l => l.id));

    let tasksUpdated = false;
    const updatedTasks = tasks.map(task => {
        const newProjectId = task.projectId && projectIds.has(task.projectId) ? task.projectId : null;
        const newLabelId = task.labelId && labelIds.has(task.labelId) ? task.labelId : null;

        if (newProjectId !== task.projectId || newLabelId !== task.labelId) {
            tasksUpdated = true;
            return { ...task, projectId: newProjectId, labelId: newLabelId };
        }
        return task;
    });

    if (tasksUpdated) {
        setTasks(updatedTasks);
    }
  }, [projects, labels, tasks, setTasks]);

  const addTask = (content: string, projectId: string | null, labelId: string | null, createdAtDate?: Date) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      content,
      description: '',
      projectId,
      labelId,
      createdAt: (createdAtDate || new Date()).toISOString(),
      completed: false,
      userId: user.id,
      repeat: 'none',
      repeatUntil: null,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const addTasksForPeriod = (taskId: string, startDateStr: string, endDateStr: string, frequency: 'daily' | 'weekdays') => {
    const templateTask = tasks.find(t => t.id === taskId);
    if (!templateTask) {
        addNotification('템플릿 할 일을 찾을 수 없습니다.', 'error');
        return;
    }

    const newTasks: Task[] = [];
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    startDate.setHours(12, 0, 0, 0);
    endDate.setHours(12, 0, 0, 0);


    if (startDate > endDate) {
        addNotification('시작일은 종료일보다 이전이어야 합니다.', 'error');
        return;
    }
    
    // Create a copy of the template task for the start date if it's not the original one
    const isOriginalTaskOnStartDate = new Date(templateTask.createdAt).toDateString() === startDate.toDateString();
    if (!isOriginalTaskOnStartDate) {
         newTasks.push({
            ...templateTask,
            id: crypto.randomUUID(),
            createdAt: startDate.toISOString(),
            completed: false,
            repeat: 'none',
            repeatUntil: null,
        });
    }


    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();

        if (frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
            continue;
        }

        // Avoid duplicating the start date task
        if (d.toDateString() === startDate.toDateString()) continue;


        newTasks.push({
            ...templateTask,
            id: crypto.randomUUID(),
            createdAt: d.toISOString(),
            completed: false,
            repeat: 'none',
            repeatUntil: null,
        });
    }

    if (newTasks.length > 0) {
        setTasks(prev => [...prev, ...newTasks]);
        addNotification(`${newTasks.length}개의 할 일이 생성되었습니다.`, 'success');
    } else {
        addNotification('선택된 기간에 생성할 할 일이 없습니다.', 'info');
    }
  };
  
  const regenerateSeriesFromTemplate = (tasks: Task[], template: Task): Task[] => {
    // Filter out any existing tasks from this series except for the template itself
    let taskList = tasks.filter(t => t.seriesId !== template.seriesId || t.id === template.id);

    // If repeat rule is removed, clean up the template and return
    if (!template.repeat || template.repeat === 'none' || !template.repeatUntil) {
        const templateIndex = taskList.findIndex(t => t.id === template.id);
        if (templateIndex > -1) {
            const cleanTemplate = { ...taskList[templateIndex] };
            delete cleanTemplate.seriesId;
            cleanTemplate.repeat = 'none';
            cleanTemplate.repeatUntil = null;
            taskList[templateIndex] = cleanTemplate;
        }
        return taskList;
    }

    const newSeriesTasks: Task[] = [];
    let currentDate = new Date(template.createdAt);
    const endDate = new Date(template.repeatUntil);
    endDate.setHours(23, 59, 59, 999);

    while (true) {
        const nextDate = calculateNextDate(currentDate, template.repeat);
        if (nextDate > endDate) break;

        newSeriesTasks.push({
            ...template,
            id: crypto.randomUUID(),
            createdAt: nextDate.toISOString(),
            completed: false,
        });

        currentDate = nextDate;
    }

    return [...taskList, ...newSeriesTasks];
  };


  const updateTask = (taskId: string, updates: Partial<Omit<Task, 'id' | 'userId'>>) => {
    setTasks(prevTasks => {
        const taskIndex = prevTasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return prevTasks;

        const originalTask = prevTasks[taskIndex];
        const updatedTask = { ...originalTask, ...updates };
        let allTasks = [...prevTasks];

        const isStartingToRepeat = updatedTask.repeat && updatedTask.repeat !== 'none' && updatedTask.repeatUntil;
        const wasRepeating = originalTask.repeat && originalTask.repeat !== 'none';
        const isStoppingRepeat = wasRepeating && (!updatedTask.repeat || updatedTask.repeat === 'none');
        const isChangingRepeat = wasRepeating && isStartingToRepeat && (originalTask.repeat !== updatedTask.repeat || originalTask.repeatUntil !== updatedTask.repeatUntil);

        // CASE 1: A repeat rule is being set (new or changed).
        if (isStartingToRepeat && !wasRepeating || isChangingRepeat) {
            const seriesId = originalTask.seriesId || crypto.randomUUID();
            const template = { ...updatedTask, seriesId: seriesId };

            // Remove any old instances of this series, but keep the one being edited
            allTasks = allTasks.filter(t => t.seriesId !== seriesId || t.id === taskId);
            const templateIndex = allTasks.findIndex(t => t.id === taskId);
            allTasks[templateIndex] = template;
            
            return regenerateSeriesFromTemplate(allTasks, template);
        }
        // CASE 2: A repeat rule is being removed.
        else if (isStoppingRepeat) {
            if (originalTask.seriesId) {
                // Remove all other tasks in the series
                allTasks = allTasks.filter(t => t.seriesId !== originalTask.seriesId || t.id === taskId);
            }
            // Update the current task to be non-repeating
            const taskToUpdateIndex = allTasks.findIndex(t => t.id === taskId);
            const cleanTask = { ...updatedTask };
            delete cleanTask.seriesId;
            cleanTask.repeatUntil = null;
            allTasks[taskToUpdateIndex] = cleanTask;
            return allTasks;
        }
        // CASE 3: Simple update (e.g., changing content, completing, etc.).
        else {
            allTasks[taskIndex] = updatedTask;
            return allTasks;
        }
    });
  };

  const updateTaskDate = (taskId: string, newDate: Date) => {
    setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, createdAt: newDate.toISOString() } : task
    ));
  };

  const toggleTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
    }
  };
  
  const duplicateTask = (taskId: string) => {
    const taskToDuplicate = tasks.find(t => t.id === taskId);
    if (taskToDuplicate) {
        const newTask: Task = {
            ...taskToDuplicate,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            completed: false,
            userId: user.id,
            seriesId: undefined, // Duplicated task is a single instance
            repeat: 'none',
            repeatUntil: null,
        };
        setTasks(prev => [newTask, ...prev]);
    }
  };
  
  const deleteAllTasks = () => {
    setTasks([]);
  };
  
  const deleteAllProjects = () => {
    setProjects([]);
    // 프로젝트 삭제 시, 해당 프로젝트에 속한 라벨들도 모두 삭제합니다.
    setLabels(prev => prev.filter(l => l.projectId === null));
  };

  const deleteAllLabels = () => {
    setLabels([]);
  };

  const handleReport = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    if (dailyReports.some(r => r.userId === user.id && r.date === todayStr)) {
      addNotification('이미 오늘 업무를 보고했습니다.', 'error');
      return;
    }

    const todaysCompletedTasks = tasks.filter(task =>
      task.userId === user.id &&
      task.completed &&
      new Date(task.createdAt).toISOString().split('T')[0] === todayStr
    );

    if (todaysCompletedTasks.length === 0) {
      addNotification('보고할 완료된 업무가 없습니다.', 'info');
      return;
    }
    
    showConfirmation(
        '일일 보고 및 퇴근',
        '오늘의 업무를 보고하고 퇴근하시겠습니까?',
        () => {
            const newReport: DailyReport = {
              userId: user.id,
              userName: user.name,
              userPicture: user.picture,
              date: todayStr,
              tasks: todaysCompletedTasks,
            };

            setDailyReports(prev => [...prev, newReport]);
            addNotification('오늘의 업무를 성공적으로 보고했습니다.', 'success');
        },
        { variant: 'primary', confirmText: '보고 및 퇴근' }
    );
  };

  const handleCancelReport = () => {
    showConfirmation(
      '보고 취소',
      '오늘의 업무 보고를 취소하시겠습니까?',
      () => {
        const todayStr = new Date().toISOString().split('T')[0];
        setDailyReports(prev => prev.filter(report => 
            !(report.userId === user.id && report.date === todayStr)
        ));
        addNotification('업무 보고가 취소되었습니다.', 'info');
      }
    );
  };

  const handleCancelMonthlyReportSubmit = (reportId: string) => {
    const report = monthlyReports.find(r => r.id === reportId);
    if (!report) return;

    showConfirmation(
      '보고서 제출 취소',
      `'${report.year}년 ${report.month + 1}월' 보고서 제출을 취소하시겠습니까? 보고서는 다시 초안 상태로 변경됩니다.`,
      () => {
        setMonthlyReports(prev =>
          prev.map(r =>
            r.id === reportId ? { ...r, status: 'draft' } : r
          )
        );
        addNotification('보고서 제출을 취소했습니다.', 'info');
      }
    );
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseTaskDetail = () => {
    setSelectedTaskId(null);
  };

  const renderView = () => {
    const userTasks = tasks.filter(task => task.userId === user.id);
    const userDailyReports = dailyReports.filter(report => report.userId === user.id);
    const userMonthlyReports = monthlyReports.filter(report => report.userId === user.id);

    const commonProps = {
        tasks: userTasks,
        projects,
        labels,
        onToggleTask: toggleTask,
        onDeleteTask: deleteTask,
        onDuplicateTask: duplicateTask,
        onSelectTask: handleSelectTask,
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const hasReportedToday = dailyReports.some(r => r.userId === user.id && r.date === todayStr);

    switch(view) {
      case 'dashboard':
        return <DashboardView {...commonProps} onReport={handleReport} onCancelReport={handleCancelReport} hasReportedToday={hasReportedToday} />;
      case 'projects':
        return <ProjectView {...commonProps} hasReportedToday={hasReportedToday} />;
      case 'labels':
        return <LabelView {...commonProps} hasReportedToday={hasReportedToday} />;
      case 'calendar':
        return <CalendarView {...commonProps} user={user} onAddTask={addTask} onUpdateTaskDate={updateTaskDate} hasReportedToday={hasReportedToday} monthlyReports={monthlyReports} setMonthlyReports={setMonthlyReports} showConfirmation={showConfirmation} onCancelMonthlyReportSubmit={handleCancelMonthlyReportSubmit} />;
      case 'export':
        return <ExportView tasks={userTasks} projects={projects} labels={labels} dailyReports={userDailyReports} monthlyReports={userMonthlyReports} />;
      case 'tasks':
      default:
        // This view is now handled directly in the main render method
        return null;
    }
  };
  
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-200">
       <Header
        currentView={view}
        setView={setView}
        onAddTask={addTask}
        projects={projects}
        labels={labels}
        user={user}
        onLogout={onLogout}
      />
      <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
        <main className="mt-4">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-gray-700/50 min-h-[60vh]">
            {view === 'tasks' && user.isAdmin ? (
              <ProjectAndLabelManagement 
                user={user}
                projects={projects}
                setProjects={setProjects}
                labels={labels}
                setLabels={setLabels}
                onDeleteAllTasks={deleteAllTasks}
                onDeleteAllProjects={deleteAllProjects}
                onDeleteAllLabels={deleteAllLabels}
                allUsers={allUsers}
                setAllUsers={setAllUsers}
                allTasks={tasks}
                dailyReports={dailyReports}
                monthlyReports={monthlyReports}
                showConfirmation={showConfirmation}
              />
            ) : view !== 'export' && renderView()}
            {view === 'export' && renderView()}
          </div>
        </main>
      </div>
       {portalRoot && createPortal(
          <div className="fixed top-5 right-5 z-50 space-y-2 w-full max-w-sm">
              {notifications.map(n => (
                  <Notification 
                      key={n.id} 
                      message={n.message} 
                      type={n.type}
                      onDismiss={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))} 
                  />
              ))}
          </div>,
          portalRoot
      )}
      <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={handleCancelConfirmation}
          confirmButtonVariant={confirmation.confirmButtonVariant}
          confirmButtonText={confirmation.confirmButtonText}
      />
      {selectedTask && portalRoot && createPortal(
          <TaskDetailModal
              task={selectedTask}
              projects={projects}
              labels={labels}
              onClose={handleCloseTaskDetail}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onDuplicateTask={duplicateTask}
              onAddTasksForPeriod={addTasksForPeriod}
          />,
          portalRoot
      )}
    </div>
  );
};

export default MainApp;