import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Project, Label, User, MonthlyWorkReport } from '../types';
import { XIcon, PaperAirplaneIcon, BoldIcon, ItalicIcon, UnderlineIcon, ReplyIcon, StrikethroughIcon, ListBulletIcon, ListOrderedIcon } from './icons/Icons';

interface MonthlyWorkReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  currentDate: Date;
  monthlyReports: MonthlyWorkReport[];
  setMonthlyReports: React.Dispatch<React.SetStateAction<MonthlyWorkReport[]>>;
  showConfirmation: (title: string, message: string, onConfirm: () => void, options?: { variant?: 'danger' | 'primary', confirmText?: string }) => void;
  onCancelSubmit: (reportId: string) => void;
}

const FormattingButton: React.FC<{ onClick: () => void; children: React.ReactNode; isActive?: boolean }> = ({ onClick, children, isActive }) => (
    <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={`p-2 rounded-md ${isActive ? 'bg-sky-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
    >
        {children}
    </button>
);

const MonthlyReportModal: React.FC<MonthlyWorkReportModalProps> = ({ isOpen, onClose, user, tasks, projects, labels, currentDate, monthlyReports, setMonthlyReports, showConfirmation, onCancelSubmit }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const reportId = `${user.id}_${year}-${month}`;
  const editorRef = useRef<HTMLDivElement>(null);

  const existingReport = useMemo(() => monthlyReports.find(r => r.id === reportId), [monthlyReports, reportId]);

  const generateReportContent = useMemo(() => {
    return () => {
        const monthTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return task.completed && taskDate.getFullYear() === year && taskDate.getMonth() === month;
        });
    
        if (monthTasks.length === 0) {
            return "<p>이번 달에 완료된 업무가 없습니다.</p>";
        }
    
        let report = `<h2>${year}년 ${month + 1}월 업무 보고서</h2><hr><br>`;
    
        const tasksByProject = monthTasks.reduce((acc, task) => {
            const projectId = task.projectId || 'unassigned';
            if (!acc[projectId]) { acc[projectId] = []; }
            acc[projectId].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    
        const addProjectSection = (project, projectTasks) => {
            report += `<h3># ${project.name}</h3>`;
            
            const tasksByLabel = projectTasks.reduce((acc, task) => {
                const labelId = task.labelId || 'unassigned';
                if (!acc[labelId]) { acc[labelId] = []; }
                acc[labelId].push(task);
                return acc;
            }, {} as Record<string, Task[]>);
            
            const sortedLabelIds = Object.keys(tasksByLabel).sort((a,b) => {
                if (a === 'unassigned') return 1; if (b === 'unassigned') return -1;
                const labelA = labels.find(l=>l.id === a)?.name || '';
                const labelB = labels.find(l=>l.id === b)?.name || '';
                return labelA.localeCompare(labelB);
            });
    
            report += '<ul>'; // Outer list for labels
            sortedLabelIds.forEach(labelId => {
                const label = labels.find(l => l.id === labelId) || { name: '미지정' };
                report += `<li><strong>@ ${label.name}</strong>`; // Label as a list item
                
                report += '<ul>'; // Inner list for tasks under the label
                tasksByLabel[labelId].forEach(task => {
                    report += `<li>${task.content}</li>`;
                });
                report += '</ul></li>'; // Close inner list and label list item
            });
            report += '</ul>'; // Close outer list for labels
        };
        
        projects.forEach(p => {
            if (tasksByProject[p.id]) { addProjectSection(p, tasksByProject[p.id]); }
        });
    
        if (tasksByProject['unassigned']) {
            addProjectSection({ name: '미지정' }, tasksByProject['unassigned']);
        }
    
        return report;
    }
  }, [tasks, projects, labels, year, month]);

  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');

  const isContentEmpty = useMemo(() => {
    if (!content) return true;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    return (tempDiv.textContent || "").trim() === '';
  }, [content]);

  useEffect(() => {
    if (isOpen) {
        const currentStatus = existingReport?.status || 'draft';
        setStatus(currentStatus);

        if (currentStatus === 'draft') {
            const initialContent = existingReport?.content || generateReportContent();
             setContent(initialContent);
             if (editorRef.current) {
                 editorRef.current.innerHTML = initialContent;
             }
        } else {
             const initialContent = existingReport.content;
             setContent(initialContent);
             if (editorRef.current) {
                 editorRef.current.innerHTML = initialContent;
             }
        }
    }
  }, [isOpen, existingReport, generateReportContent]);
  
  const handleSave = (newStatus: 'draft' | 'submitted') => {
    const finalContent = editorRef.current?.innerHTML || content;
    const report: MonthlyWorkReport = {
        id: reportId,
        userId: user.id,
        year, month,
        content: finalContent,
        status: newStatus,
        submittedAt: newStatus === 'submitted' ? new Date().toISOString() : existingReport?.submittedAt
    };

    setMonthlyReports(prev => {
        const index = prev.findIndex(r => r.id === reportId);
        if (index > -1) {
            const newReports = [...prev];
            newReports[index] = report;
            return newReports;
        } else {
            return [...prev, report];
        }
    });
  };

  const handleSubmit = () => {
    showConfirmation('월간 보고서 제출', '보고서를 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.',
        () => {
            handleSave('submitted');
            setStatus('submitted');
            // Do not close on submit, allow cancel
        },
        { variant: 'primary', confirmText: '제출' }
    );
  };

  const handleCancelSubmit = () => {
    onCancelSubmit(reportId);
    setStatus('draft');
  }

  const handleClose = () => {
    const currentContent = editorRef.current?.innerHTML || '';
    if (status === 'draft' && (!existingReport || existingReport.content !== currentContent)) {
        handleSave('draft');
    }
    onClose();
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in" onClick={handleClose}>
      <div className="bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl w-full max-w-6xl p-6 m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-sky-300">
            {currentDate.toLocaleString('ko-KR', { year: 'numeric', month: 'long' })} 월간 업무 보고서
          </h2>
          <div className="flex items-center gap-2">
            {status === 'submitted' ? (
                <>
                    <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-full">제출 완료</span>
                    <button 
                        onClick={handleCancelSubmit}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-1.5 px-3 rounded-lg text-sm transition-colors"
                    >
                        <ReplyIcon className="w-5 h-5"/>
                        <span>제출 취소</span>
                    </button>
                </>
            ) : (
                <button 
                    onClick={handleSubmit}
                    disabled={isContentEmpty}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1.5 px-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PaperAirplaneIcon className="w-5 h-5"/>
                    <span>제출하기</span>
                </button>
            )}
            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-white rounded-full transition-colors">
                <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {status === 'draft' && (
            <div className="flex-shrink-0 flex items-center justify-start gap-2 p-2 mb-2 bg-gray-950/70 rounded-md border border-gray-700">
                <div className="flex items-center gap-2">
                    <FormattingButton onClick={() => applyFormat('bold')}><BoldIcon className="w-5 h-5" /></FormattingButton>
                    <FormattingButton onClick={() => applyFormat('italic')}><ItalicIcon className="w-5 h-5" /></FormattingButton>
                    <FormattingButton onClick={() => applyFormat('underline')}><UnderlineIcon className="w-5 h-5" /></FormattingButton>
                    <div className="w-px h-5 bg-gray-600 mx-1"></div>
                    <FormattingButton onClick={() => applyFormat('strikeThrough')}><StrikethroughIcon className="w-5 h-5" /></FormattingButton>
                    <FormattingButton onClick={() => applyFormat('insertUnorderedList')}><ListBulletIcon className="w-5 h-5" /></FormattingButton>
                    <FormattingButton onClick={() => applyFormat('insertOrderedList')}><ListOrderedIcon className="w-5 h-5" /></FormattingButton>
                </div>
            </div>
        )}

        <div className="flex-grow overflow-y-auto bg-gray-950/70 rounded-md border border-gray-700 focus-within:ring-2 focus-within:ring-sky-500">
            <div
                ref={editorRef}
                contentEditable={status === 'draft'}
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                className="w-full h-full p-4 outline-none font-sans text-sm resize-none disabled:opacity-70 report-content min-h-[55vh]"
            />
        </div>
        <div className="flex-shrink-0 pt-3 text-xs text-gray-400">
            {status === 'draft' 
                ? '창을 닫으면 초안이 자동 저장됩니다.' 
                : '보고서가 제출되어 수정할 수 없습니다. 제출을 취소하면 다시 편집할 수 있습니다.'}
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportModal;