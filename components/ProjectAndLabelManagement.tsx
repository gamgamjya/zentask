import React, { useState, useEffect } from 'react';
import { Project, Label, User, DailyReport, Task, MonthlyWorkReport } from '../types';
import LabelManagement from './LabelManagement';
import { FolderIcon, TagIcon, PlusIcon, TrashIcon, PencilIcon, UsersIcon, DocumentTextIcon, ArrowDownTrayIcon } from './icons/Icons';
import DangerZone from './DangerZone';
import AccountManagementView from './AccountManagementView';
import MonthlyReportsView from './MonthlyReportsView';
import * as XLSX from 'xlsx';

interface Props {
    user: User;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    labels: Label[];
    setLabels: React.Dispatch<React.SetStateAction<Label[]>>;
    onDeleteAllTasks: () => void;
    onDeleteAllProjects: () => void;
    onDeleteAllLabels: () => void;
    allUsers: User[];
    setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
    allTasks: Task[];
    dailyReports: DailyReport[];
    monthlyReports: MonthlyWorkReport[];
    showConfirmation: (title: string, message: string, onConfirm: () => void, options?: { variant?: 'danger' | 'primary', confirmText?: string }) => void;
}

const COLORS = [
  'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500',
  'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-purple-500'
];

const AdminBadge: React.FC = () => (
    <span className="text-xs font-bold bg-sky-600 text-sky-100 rounded-full px-2 py-0.5 leading-none align-middle">
      관리자 전용
    </span>
);

interface UserReportsViewProps {
    users: User[];
    reports: DailyReport[];
    projects: Project[];
    labels: Label[];
}

const UserReportsView: React.FC<UserReportsViewProps> = ({ users, reports, projects, labels }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const selectedReports = reports.filter(r => r.date === selectedDate);
    
    useEffect(() => {
        setExpandedUserId(null);
    }, [selectedDate]);

    const exportToExcel = (data: any[], fileName: string) => {
        if (data.length === 0) {
            alert("선택된 기간에 내보낼 데이터가 없습니다.");
            return;
        }
        try {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            XLSX.writeFile(wb, `${fileName}.xlsx`);
        } catch (error) {
            console.error("Excel 내보내기 오류:", error);
            alert("파일을 내보내는 중 오류가 발생했습니다.");
        }
    };

    const handleDownloadAllDailyReports = () => {
        const data = selectedReports.flatMap(report =>
            report.tasks.map(task => ({
                '보고자': report.userName,
                '보고 날짜': report.date,
                '완료된 할 일': task.content,
                '프로젝트': projects.find(p => p.id === task.projectId)?.name || '미지정',
                '라벨': labels.find(l => l.id === task.labelId)?.name || '미지정',
            }))
        );
        exportToExcel(data, `일일_업무_보고_전체_${selectedDate}`);
    };

    const handleDownloadUserDailyReport = (userId: string) => {
        const report = selectedReports.find(r => r.userId === userId);
        if (!report) {
            alert('해당 사용자의 보고서가 없습니다.');
            return;
        }
        const data = report.tasks.map(task => ({
            '보고 날짜': report.date,
            '완료된 할 일': task.content,
            '프로젝트': projects.find(p => p.id === task.projectId)?.name || '미지정',
            '라벨': labels.find(l => l.id === task.labelId)?.name || '미지정',
        }));
        exportToExcel(data, `일일_업무_보고_${report.userName}_${selectedDate}`);
    };

    const changeDate = (offset: number) => {
        const currentDate = new Date(selectedDate);
        currentDate.setUTCDate(currentDate.getUTCDate() + offset);
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="text-xl font-bold text-gray-300">일일 업무 보고 현황</h3>
                 <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
                        <button onClick={() => changeDate(-1)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm">&lt; 어제</button>
                        <input
                            id="report-date-picker"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-gray-900/70 border border-gray-600 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button onClick={() => changeDate(1)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm">내일 &gt;</button>
                        <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors text-sm font-semibold">오늘</button>
                    </div>
                    <button 
                        onClick={handleDownloadAllDailyReports} 
                        className="flex items-center gap-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedReports.length === 0}
                        title="해당일 전체 보고서 다운로드"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>전체 다운로드</span>
                    </button>
                </div>
            </div>
            <div className="space-y-3">
                {users.map(user => {
                    const report = selectedReports.find(r => r.userId === user.id);
                    const isExpanded = expandedUserId === user.id;

                    return (
                        <div key={user.id} className="bg-gray-800/40 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <span className="font-semibold">{user.name}</span>
                                        {user.isAdmin && <span className="ml-2 text-xs font-bold bg-indigo-500 text-white rounded-full px-2 py-0.5">관리자</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                                    {report ? (
                                        <>
                                            <span className="text-sm font-semibold text-emerald-400">보고 완료</span>
                                            <button
                                                onClick={() => handleDownloadUserDailyReport(user.id)}
                                                className="text-xs bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 flex items-center gap-1"
                                                title="개별 보고서 다운로드"
                                            >
                                                <ArrowDownTrayIcon className="w-3 h-3"/>
                                                <span>다운로드</span>
                                            </button>
                                            <button 
                                                onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                                                className="text-sm bg-gray-700 hover:bg-gray-600 rounded px-3 py-1"
                                            >
                                                {isExpanded ? '숨기기' : '완료 업무 보기'} ({report.tasks.length})
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-sm font-semibold text-amber-400">미보고</span>
                                    )}
                                </div>
                            </div>
                            {isExpanded && report && (
                                <div className="mt-4 pl-12 ml-5">
                                    <div className="space-y-2 pl-4">
                                        <h4 className="font-semibold text-gray-300 mb-2">완료된 업무 목록</h4>
                                        {report.tasks.map(task => {
                                            const project = projects.find(p => p.id === task.projectId);
                                            const label = labels.find(l => l.id === task.labelId);
                                            return (
                                                <div key={task.id} className="flex items-center justify-between text-sm text-gray-300 p-2 bg-gray-900 rounded">
                                                    <span>{task.content}</span>
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
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ManagementTabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex-grow text-center ${
            isActive ? 'bg-sky-600/80 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
        }`}
    >
        {label}
    </button>
);


const ManagementView: React.FC<Omit<Props, 'allTasks' | 'dailyReports' | 'setAllUsers' | 'monthlyReports'>> = ({ user, projects, setProjects, labels, setLabels, onDeleteAllTasks, onDeleteAllProjects, onDeleteAllLabels, showConfirmation }) => {
    type ManagementTab = 'projects' | 'global_labels' | 'project_labels';
    const [activeManagementTab, setActiveManagementTab] = useState<ManagementTab>('projects');
    const [selectedProjectIdForLabels, setSelectedProjectIdForLabels] = useState<string>('');

    useEffect(() => {
        if (projects.length > 0 && !selectedProjectIdForLabels) {
            setSelectedProjectIdForLabels(projects[0].id);
        } else if (projects.length > 0 && !projects.find(p => p.id === selectedProjectIdForLabels)) {
            setSelectedProjectIdForLabels(projects[0].id);
        } else if (projects.length === 0) {
            setSelectedProjectIdForLabels('');
        }
    }, [projects, selectedProjectIdForLabels]);

    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState(COLORS[0]);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const setProjectsWrapper: React.Dispatch<React.SetStateAction<Project[]>> = (updater) => {
        const currentProjects = projects;
        const newProjects = typeof updater === 'function' ? updater(currentProjects) : updater;

        if (newProjects.length < currentProjects.length) {
            const newProjectIds = new Set(newProjects.map(p => p.id));
            const deletedProjectIds = currentProjects
                .filter(p => !newProjectIds.has(p.id))
                .map(p => p.id);
            
            if (deletedProjectIds.length > 0) {
                const deletedProjectIdsSet = new Set(deletedProjectIds);
                setLabels(prevLabels => prevLabels.filter(l => l.projectId === null || !deletedProjectIdsSet.has(l.projectId!)));
            }
        }
        setProjects(newProjects);
    };

    const handleAddProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            setProjectsWrapper(prev => [...prev, {
                id: crypto.randomUUID(),
                name: newProjectName.trim(),
                color: newProjectColor,
            }]);
            setNewProjectName('');
        }
    };

    const handleDeleteProject = (id: string) => {
        const projectToDelete = projects.find(p => p.id === id);
        if (projectToDelete) {
            showConfirmation(
                '프로젝트 삭제',
                `'${projectToDelete.name}' 프로젝트를 정말 삭제하시겠습니까? 이 프로젝트에 속한 모든 라벨도 함께 삭제됩니다.`,
                () => {
                    setProjectsWrapper(prev => prev.filter(p => p.id !== id));
                }
            );
        }
    };
    
    const handleUpdateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if(editingProject && editingProject.name.trim()) {
            setProjectsWrapper(prev => prev.map(p => p.id === editingProject.id ? editingProject : p));
            setEditingProject(null);
        }
    };

    const startEditingProject = (project: Project) => {
        setEditingProject({...project});
    };

    return (
        <div>
            <div className="flex items-center gap-2 p-1 bg-gray-800/30 border border-gray-700/50 rounded-xl mb-6">
                <ManagementTabButton label="프로젝트 관리" isActive={activeManagementTab === 'projects'} onClick={() => setActiveManagementTab('projects')} />
                <ManagementTabButton label="글로벌 라벨 관리" isActive={activeManagementTab === 'global_labels'} onClick={() => setActiveManagementTab('global_labels')} />
                <ManagementTabButton label="프로젝트별 라벨 관리" isActive={activeManagementTab === 'project_labels'} onClick={() => setActiveManagementTab('project_labels')} />
            </div>

            <div className="animate-fade-in-fast">
                {activeManagementTab === 'projects' && (
                    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-300">
                           <FolderIcon className="w-6 h-6" /> 프로젝트 관리
                        </h3>
                        <form onSubmit={handleAddProject} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="새 프로젝트 이름"
                                className="flex-grow bg-gray-900/70 border border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
                                {COLORS.map(color => (
                                    <button type="button" key={color} onClick={() => setNewProjectColor(color)} className={`w-5 h-5 rounded-full ${color} ${newProjectColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : ''}`}></button>
                                ))}
                            </div>
                            <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold p-2 rounded-lg transition-colors">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </form>
                         <div className="space-y-2">
                            {projects.map(project => (
                                <div key={project.id}>
                                    {editingProject?.id === project.id ? (
                                        <form onSubmit={handleUpdateProject} className="flex items-center gap-2 p-2 bg-gray-700/80 rounded-lg">
                                            <input
                                                type="text"
                                                value={editingProject.name}
                                                onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                                                className="flex-grow bg-gray-600 border border-gray-500 rounded-md px-2 py-1"
                                            />
                                            <div className="flex items-center gap-1">
                                                {COLORS.map(color => (
                                                    <button type="button" key={color} onClick={() => setEditingProject({...editingProject, color: color})} className={`w-5 h-5 rounded-full ${color} ${editingProject.color === color ? 'ring-2 ring-white' : ''}`}></button>
                                                ))}
                                            </div>
                                            <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-1">저장</button>
                                            <button type="button" onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-gray-200 p-1">취소</button>
                                        </form>
                                    ) : (
                                        <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg group">
                                            <span className={`w-3 h-3 rounded-full ${project.color}`}></span>
                                            <span className="flex-grow">{project.name}</span>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                <button onClick={() => startEditingProject(project)} className="p-1 text-gray-400 hover:text-amber-400 transition-colors">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteProject(project.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeManagementTab === 'global_labels' && (
                    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                         <LabelManagement
                            key="global"
                            title="글로벌 라벨"
                            labels={labels.filter(l => l.projectId === null)}
                            setLabels={setLabels}
                            projectId={null}
                            showConfirmation={showConfirmation}
                        />
                    </div>
                )}

                {activeManagementTab === 'project_labels' && (
                     <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                        <div className="mb-4">
                            <label htmlFor="project-select-for-labels" className="block text-sm font-medium text-gray-400 mb-2">라벨을 관리할 프로젝트 선택:</label>
                            <select
                                id="project-select-for-labels"
                                value={selectedProjectIdForLabels}
                                onChange={(e) => setSelectedProjectIdForLabels(e.target.value)}
                                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                disabled={projects.length === 0}
                            >
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        {projects.length > 0 && selectedProjectIdForLabels ? (
                            <LabelManagement
                                key={selectedProjectIdForLabels}
                                title={`'${projects.find(p => p.id === selectedProjectIdForLabels)?.name}' 프로젝트 라벨`}
                                labels={labels.filter(l => l.projectId === selectedProjectIdForLabels)}
                                setLabels={setLabels}
                                projectId={selectedProjectIdForLabels}
                                showConfirmation={showConfirmation}
                            />
                        ) : (
                            <p className="text-gray-500 text-center py-4">프로젝트를 먼저 생성해주세요.</p>
                        )}
                    </div>
                )}
            </div>
            {user.isAdmin && (
                <DangerZone 
                    onDeleteAllTasks={onDeleteAllTasks} 
                    onDeleteAllProjects={onDeleteAllProjects}
                    onDeleteAllLabels={onDeleteAllLabels}
                    showConfirmation={showConfirmation}
                />
            )}
        </div>
    );
};


const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            isActive ? 'bg-sky-600 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
        }`}
    >
        {label}
    </button>
);


const ProjectAndLabelManagement: React.FC<Props> = (props) => {
    const { allUsers, setAllUsers, dailyReports, projects, labels, user, allTasks, monthlyReports, showConfirmation } = props;
    type AdminTab = 'management' | 'daily_reports' | 'monthly_reports' | 'accounts';
    const [activeTab, setActiveTab] = useState<AdminTab>('management');

    return (
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800/50">
            <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-gray-700 pb-4 mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-200 flex items-center gap-3 flex-shrink-0">
                    관리 페이지 <AdminBadge />
                </h2>
                <nav className="flex items-center gap-2 p-1 bg-gray-800/50 rounded-lg flex-wrap justify-center sm:justify-end">
                    <TabButton 
                        label="프로젝트/라벨" 
                        isActive={activeTab === 'management'} 
                        onClick={() => setActiveTab('management')} 
                    />
                    <TabButton 
                        label="일일 보고 현황" 
                        isActive={activeTab === 'daily_reports'} 
                        onClick={() => setActiveTab('daily_reports')} 
                    />
                     <TabButton 
                        label="월간 보고 현황" 
                        isActive={activeTab === 'monthly_reports'} 
                        onClick={() => setActiveTab('monthly_reports')} 
                    />
                     <TabButton 
                        label="계정 관리" 
                        isActive={activeTab === 'accounts'} 
                        onClick={() => setActiveTab('accounts')} 
                    />
                </nav>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'management' && <ManagementView {...props} />}
                {activeTab === 'daily_reports' && <UserReportsView users={allUsers} reports={dailyReports} projects={projects} labels={labels} />}
                {activeTab === 'monthly_reports' && <MonthlyReportsView allUsers={allUsers} monthlyReports={monthlyReports} />}
                {activeTab === 'accounts' && <AccountManagementView currentUser={user} allUsers={allUsers} setAllUsers={setAllUsers} showConfirmation={showConfirmation} />}
            </div>
        </div>
    );
};

export default ProjectAndLabelManagement;