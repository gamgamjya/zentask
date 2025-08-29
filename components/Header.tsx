import React from 'react';
import { View, Project, Label, User } from '../types';
import { CalendarIcon, FolderIcon, TagIcon, TasksIcon, DashboardIcon, ArrowDownTrayIcon } from './icons/Icons';
import TaskInput from './TaskInput';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  onAddTask: (content: string, projectId: string | null, labelId: string | null) => void;
  projects: Project[];
  labels: Label[];
  user: User;
  onLogout: () => void;
}

const NavButton: React.FC<{
  label: string;
  viewName: View;
  currentView: View;
  setView: (view: View) => void;
  children: React.ReactNode;
}> = ({ label, viewName, currentView, setView, children }) => {
  const isActive = currentView === viewName;
  return (
    <button
      onClick={() => setView(viewName)}
      className={`flex flex-col items-center justify-center gap-1 p-2 w-24 h-20 rounded-xl transition-colors duration-200 ${
        isActive
          ? 'bg-sky-500/10 text-sky-400'
          : 'text-gray-400 hover:bg-gray-800 hover:text-sky-400'
      }`}
    >
      {children}
      <span className="mt-1 text-xs font-semibold text-center leading-tight">{label}</span>
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentView, setView, onAddTask, projects, labels, user, onLogout }) => {
  return (
    <header className="sticky top-0 z-30 bg-gray-900/60 backdrop-blur-xl border-b border-gray-800">
        <div className="w-full max-w-6xl mx-auto p-4 md:px-8">
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-x-4 gap-y-2">
                {/* Logo */}
                <div className="order-1 flex-shrink-0">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                        ZenTask
                    </h1>
                </div>

                {/* Navigation */}
                <div className="order-3 md:order-2 w-full md:w-auto md:flex-grow flex justify-center">
                    <nav className="flex items-center justify-center gap-1 p-1 bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-2xl flex-wrap">
                        <NavButton label="대시보드" viewName="dashboard" currentView={currentView} setView={setView}>
                            <DashboardIcon className="w-6 h-6" />
                        </NavButton>
                        <NavButton label="캘린더" viewName="calendar" currentView={currentView} setView={setView}>
                            <CalendarIcon className="w-6 h-6" />
                        </NavButton>
                        <NavButton label="프로젝트별" viewName="projects" currentView={currentView} setView={setView}>
                            <FolderIcon className="w-6 h-6" />
                        </NavButton>
                        <NavButton label="라벨별" viewName="labels" currentView={currentView} setView={setView}>
                            <TagIcon className="w-6 h-6" />
                        </NavButton>
                        <NavButton label="내보내기" viewName="export" currentView={currentView} setView={setView}>
                            <ArrowDownTrayIcon className="w-6 h-6" />
                        </NavButton>
                        {user.isAdmin && (
                          <NavButton label="관리" viewName="tasks" currentView={currentView} setView={setView}>
                              <TasksIcon className="w-6 h-6" />
                          </NavButton>
                        )}
                    </nav>
                </div>
                
                {/* User Info */}
                <div className="order-2 md:order-3 flex-shrink-0">
                    <div className="flex items-center gap-2 p-1 pr-2 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-full">
                        <div className="flex items-center gap-2">
                            <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                            <span className="font-semibold text-sm hidden sm:inline-flex">
                                {user.name}
                            </span>
                        </div>
                        {user.isAdmin && (
                            <span className="text-xs font-bold bg-sky-600 text-sky-100 rounded-full px-2.5 py-1 leading-none">
                                관리자
                            </span>
                        )}
                        <button 
                            onClick={onLogout} 
                            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full px-3 py-1.5 transition-colors"
                            aria-label="로그아웃"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <TaskInput onAddTask={onAddTask} projects={projects} labels={labels} />
            </div>
        </div>
    </header>
  );
};

export default Header;