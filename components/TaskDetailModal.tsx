import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Project, Label } from '../types';
import { XIcon, FolderIcon, TagIcon, CalendarIcon, RefreshIcon, TrashIcon, DuplicateIcon, ChevronDownIcon, CheckCircleIcon, CalendarDaysIcon, CheckIcon, DotsVerticalIcon } from './icons/Icons';

interface TaskDetailModalProps {
    task: Task;
    projects: Project[];
    labels: Label[];
    onClose: () => void;
    onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'userId'>>) => void;
    onDeleteTask: (taskId: string) => void;
    onDuplicateTask: (taskId: string) => void;
    onAddTasksForPeriod: (taskId: string, startDate: string, endDate: string, frequency: 'daily' | 'weekdays') => void;
}

type SuggestionType = 'project' | 'label';
interface Suggestion {
  id: string;
  name: string;
  type: SuggestionType;
}


const CustomDropdown: React.FC<{
    items: ({ id: string; name: string; color: string } | { id: null; name: string; })[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    icon: React.ReactNode;
    label: string;
}> = ({ items, selectedId, onSelect, icon, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedItem = items.find(item => item.id === selectedId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    return (
        <div>
            <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2">{icon} {label}</label>
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedItem && 'color' in selectedItem && <span className={`w-3 h-3 rounded-full ${selectedItem.color} flex-shrink-0`}></span>}
                        <span className="truncate">{selectedItem?.name || '미지정'}</span>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {items.map(item => (
                            <li
                                key={item.id ?? 'none'}
                                onClick={() => { onSelect(item.id); setIsOpen(false); }}
                                className="px-3 py-2 hover:bg-sky-600 cursor-pointer flex items-center gap-2"
                            >
                                {'color' in item && <span className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`}></span>}
                                {item.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};


const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, projects, labels, onClose, onUpdateTask, onDeleteTask, onDuplicateTask, onAddTasksForPeriod }) => {
    const [rawContent, setRawContent] = useState('');
    const [description, setDescription] = useState(task.description || '');
    const [projectId, setProjectId] = useState(task.projectId);
    const [labelId, setLabelId] = useState(task.labelId);
    const [createdAt, setCreatedAt] = useState(task.createdAt.split('T')[0]);
    const [repeat, setRepeat] = useState<Task['repeat']>(task.repeat || 'none');
    const [repeatUntil, setRepeatUntil] = useState(task.repeatUntil ? task.repeatUntil.split('T')[0] : '');
    const [isCompleted, setIsCompleted] = useState(task.completed);

    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const triggerRef = useRef<{ char: '#' | '@'; position: number } | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    
    const [isPeriodPopupOpen, setIsPeriodPopupOpen] = useState(false);
    const [periodStartDate, setPeriodStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [periodEndDate, setPeriodEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [periodFrequency, setPeriodFrequency] = useState<'daily' | 'weekdays'>('daily');

    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditingDescription && descriptionTextareaRef.current) {
            descriptionTextareaRef.current.focus();
            descriptionTextareaRef.current.selectionStart = descriptionTextareaRef.current.value.length;
            descriptionTextareaRef.current.selectionEnd = descriptionTextareaRef.current.value.length;
        }
    }, [isEditingDescription]);

    const linkify = (text: string) => {
        if (!text) return '';
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        let newText = text.replace(urlRegex, (url) => {
            let fullUrl = url;
            if (!fullUrl.startsWith('http')) {
                fullUrl = 'https://' + fullUrl;
            }
            return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:underline">${url}</a>`;
        });
        return newText.replace(/\n/g, '<br />');
    };

    const linkifiedDescription = useMemo(() => linkify(description), [description]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [moreMenuRef]);

    // Initialize states from task prop
    useEffect(() => {
        const project = projects.find(p => p.id === task.projectId);
        const label = labels.find(l => l.id === task.labelId);
        let initialRawContent = task.content;
        if (project) initialRawContent += ` #${project.name}`;
        if (label) initialRawContent += ` @${label.name}`;
        setRawContent(initialRawContent);

        setDescription(task.description || '');
        setProjectId(task.projectId);
        setLabelId(task.labelId);
        setCreatedAt(task.createdAt.split('T')[0]);
        setRepeat(task.repeat || 'none');
        setRepeatUntil(task.repeatUntil ? task.repeatUntil.split('T')[0] : '');
        setIsCompleted(task.completed);
    }, [task, projects, labels]);

    // Sync rawContent changes (from typing) to projectId and labelId states
    useEffect(() => {
        const projectRegex = /#(\S+)/g;
        const labelRegex = /@(\S+)/g;
    
        const projectMatches = [...rawContent.matchAll(projectRegex)];
        let newProjectId: string | null = null;
        if (projectMatches.length > 0) {
            const lastProjectName = projectMatches[projectMatches.length - 1][1].toLowerCase();
            const foundProject = projects.find(p => p.name.toLowerCase() === lastProjectName);
            newProjectId = foundProject ? foundProject.id : null;
        }
    
        const labelMatches = [...rawContent.matchAll(labelRegex)];
        let newLabelId: string | null = null;
        if (labelMatches.length > 0) {
            const lastLabelName = labelMatches[labelMatches.length - 1][1].toLowerCase();
            const currentProjectContext = newProjectId;
            const projectSpecificLabel = labels.find(l => l.name.toLowerCase() === lastLabelName && l.projectId === currentProjectContext);
            const globalLabel = labels.find(l => l.name.toLowerCase() === lastLabelName && l.projectId === null);
            newLabelId = (projectSpecificLabel || globalLabel)?.id || null;
        }
    
        if (projectId !== newProjectId) {
          setProjectId(newProjectId);
        }
        if (labelId !== newLabelId) {
          setLabelId(newLabelId);
        }
    }, [rawContent, projects, labels, projectId, labelId]);


    const resetSuggestions = () => {
        setSuggestions([]);
        setActiveSuggestion(0);
        triggerRef.current = null;
    };
    
     useEffect(() => {
        const projectRegexWithCapture = /#(\S+)/;
        const projectMatchForLabel = rawContent.match(projectRegexWithCapture);
        let currentProjectIdInText: string | null = null;
        if (projectMatchForLabel) {
            const projectName = projectMatchForLabel[1];
            const project = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
            if (project) {
                currentProjectIdInText = project.id;
            }
        }

        const projectRegex = /#([\p{L}\d_]*)$/u;
        const labelRegex = /@([\p{L}\d_]*)$/u;

        const projectMatch = rawContent.match(projectRegex);
        const labelMatch = rawContent.match(labelRegex);

        if (projectMatch) {
            triggerRef.current = { char: '#', position: projectMatch.index! };
            const query = projectMatch[1].toLowerCase();
            setSuggestions(
                projects
                    .filter(p => p.name.toLowerCase().includes(query))
                    .map(p => ({ id: p.id, name: p.name, type: 'project' }))
            );
        } else if (labelMatch) {
            triggerRef.current = { char: '@', position: labelMatch.index! };
            const query = labelMatch[1].toLowerCase();
            const filteredLabels = labels
                .filter(l => l.projectId === null || l.projectId === currentProjectIdInText)
                .filter(l => l.name.toLowerCase().includes(query));

            setSuggestions(
                filteredLabels.map(l => ({ id: l.id, name: l.name, type: 'label' }))
            );
        } else {
            resetSuggestions();
        }
    }, [rawContent, projects, labels]);


    const handleSelectSuggestion = (suggestion: Suggestion) => {
        if (!triggerRef.current) return;
        const prefix = rawContent.substring(0, triggerRef.current.position);
        setRawContent(`${prefix}${triggerRef.current.char}${suggestion.name} `);
        resetSuggestions();
        titleInputRef.current?.focus();
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (suggestions.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestion(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if(suggestions[activeSuggestion]){
                handleSelectSuggestion(suggestions[activeSuggestion]);
            }
        } else if (e.key === 'Escape') {
            resetSuggestions();
        }
    };
    
    const getBaseContent = (text: string): string => {
        return text.replace(/#(\S+)/g, '').replace(/@(\S+)/g, '').trim();
    };

    const handleProjectSelect = (selectedId: string | null) => {
        setProjectId(selectedId);
    
        const currentLabel = labels.find(l => l.id === labelId);
        let newLabelId = labelId;
        if (currentLabel && currentLabel.projectId !== null && currentLabel.projectId !== selectedId) {
            newLabelId = null;
            setLabelId(null);
        }
        
        const baseContent = getBaseContent(rawContent);
        const selectedProject = projects.find(p => p.id === selectedId);
        const newCurrentLabel = labels.find(l => l.id === newLabelId);
    
        let newRawContent = baseContent;
        if (selectedProject) {
            newRawContent += ` #${selectedProject.name}`;
        }
        if (newCurrentLabel) {
            newRawContent += ` @${newCurrentLabel.name}`;
        }
        setRawContent(newRawContent);
    };

    const handleLabelSelect = (selectedId: string | null) => {
        setLabelId(selectedId);
        
        const baseContent = getBaseContent(rawContent);
        const currentProject = projects.find(p => p.id === projectId);
        const selectedLabel = labels.find(l => l.id === selectedId);
    
        let newRawContent = baseContent;
        if (currentProject) {
            newRawContent += ` #${currentProject.name}`;
        }
        if (selectedLabel) {
            newRawContent += ` @${selectedLabel.name}`;
        }
        setRawContent(newRawContent);
    };

    const handleSave = () => {
        const updates: Partial<Omit<Task, 'id' | 'userId'>> = {};
        
        const projectRegex = /#(\S+)/g;
        const labelRegex = /@(\S+)/g;
        const finalContent = rawContent.replace(projectRegex, '').replace(labelRegex, '').trim();

        if (finalContent && finalContent !== task.content) {
            updates.content = finalContent;
        }
        if (description.trim() !== (task.description || '')) updates.description = description.trim();
        if (projectId !== task.projectId) updates.projectId = projectId;
        if (labelId !== task.labelId) updates.labelId = labelId;
        
        const newCreatedAt = new Date(createdAt).toISOString();
        if (newCreatedAt.split('T')[0] !== task.createdAt.split('T')[0]) updates.createdAt = newCreatedAt;

        if (repeat !== (task.repeat || 'none')) updates.repeat = repeat;
        if (repeat === 'none') {
            if (task.repeatUntil !== null) updates.repeatUntil = null;
        } else {
            const newRepeatUntil = repeatUntil ? new Date(repeatUntil).toISOString() : null;
            if (newRepeatUntil !== task.repeatUntil) updates.repeatUntil = newRepeatUntil;
        }
        
        if (isCompleted !== task.completed) {
            updates.completed = isCompleted;
        }

        if (Object.keys(updates).length > 0) {
            onUpdateTask(task.id, updates);
        }
        onClose();
    };
    
    const handleClose = () => {
        onClose();
    };

    const handleDelete = () => {
        onDeleteTask(task.id);
        setIsMoreMenuOpen(false);
        onClose();
    };
    
    const handleDuplicate = () => {
        onDuplicateTask(task.id);
        setIsMoreMenuOpen(false);
        onClose();
    };

    const handleCreatePeriodTasks = () => {
        if (!periodStartDate || !periodEndDate) {
            alert('시작일과 종료일을 모두 선택해주세요.');
            return;
        }
        onAddTasksForPeriod(task.id, periodStartDate, periodEndDate, periodFrequency);
        onClose(); // Close the main modal after creation
    };
    
    const projectItems = [{ id: null, name: '미지정' }, ...projects];
    const availableLabels = labels.filter(l => l.projectId === null || l.projectId === projectId);
    const labelItems = [{ id: null, name: '미지정' }, ...availableLabels];
    
    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in" onClick={handleClose}>
                <div className="bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex-shrink-0 flex items-center justify-end p-4 border-b border-gray-700 gap-3">
                        <div className="relative" ref={moreMenuRef}>
                            <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} title="추가 작업" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                                <DotsVerticalIcon className="w-5 h-5" />
                            </button>
                            {isMoreMenuOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 py-1">
                                    <button onClick={handleDuplicate} className="w-full text-left px-3 py-1.5 hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <DuplicateIcon className="w-5 h-5" /> 복제
                                    </button>
                                    <button onClick={handleDelete} className="w-full text-left px-3 py-1.5 hover:bg-gray-700 text-red-400 flex items-center gap-3 transition-colors">
                                        <TrashIcon className="w-5 h-5" /> 삭제
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <button onClick={handleClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors">
                            취소
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg font-semibold transition-colors flex items-center gap-2">
                            <CheckIcon className="w-5 h-5" /> 저장
                        </button>
                    </div>

                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-x-8 p-6 overflow-y-auto">
                        <div className="md:col-span-2 flex items-start gap-4">
                            <button 
                                onClick={() => setIsCompleted(!isCompleted)} 
                                className="flex-shrink-0 mt-1.5"
                                aria-label={isCompleted ? "완료 취소" : "완료로 표시"}
                            >
                                {isCompleted ? (
                                    <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
                                ) : (
                                    <span className="w-8 h-8 block border-2 border-gray-500 rounded-full hover:border-sky-400 transition-colors"></span>
                                )}
                            </button>
                            <div className="flex-grow space-y-6">
                                <div className="relative">
                                    <input
                                        ref={titleInputRef}
                                        type="text"
                                        value={rawContent}
                                        onChange={(e) => setRawContent(e.target.value)}
                                        onKeyDown={handleTitleKeyDown}
                                        className={`w-full bg-transparent text-3xl font-bold focus:outline-none placeholder-gray-500 transition-colors ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-100'}`}
                                        placeholder="할 일 제목"
                                        autoComplete="off"
                                    />
                                    {suggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-gray-800 border border-gray-700 rounded-lg mt-2 shadow-lg overflow-hidden">
                                        {suggestions.map((suggestion, index) => (
                                            <li
                                            key={suggestion.id}
                                            className={`px-4 py-2 cursor-pointer ${
                                                index === activeSuggestion ? 'bg-sky-600' : 'hover:bg-gray-700'
                                            }`}
                                            onClick={() => handleSelectSuggestion(suggestion)}
                                            >
                                            {suggestion.type === 'project' ? '#' : '@'}{suggestion.name}
                                            </li>
                                        ))}
                                        </ul>
                                    )}
                                </div>
                                
                                <div className="mt-4">
                                    <label className="text-sm font-semibold text-gray-400 mb-2 block">설명</label>
                                    {isEditingDescription ? (
                                        <textarea
                                            ref={descriptionTextareaRef}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onBlur={() => setIsEditingDescription(false)}
                                            className={`w-full h-48 bg-gray-800/60 p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'}`}
                                            placeholder="세부 설명을 추가하세요..."
                                        />
                                    ) : (
                                        <div
                                            onClick={() => setIsEditingDescription(true)}
                                            className={`w-full min-h-[4rem] p-3 cursor-text whitespace-pre-wrap overflow-y-auto rounded-lg hover:bg-gray-800/50 transition-colors ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'}`}
                                        >
                                            {description.trim() ? (
                                                <div dangerouslySetInnerHTML={{ __html: linkifiedDescription }} />
                                            ) : (
                                                <p className="text-gray-500">세부 설명을 추가하세요...</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                        <div className="md:col-span-1 space-y-5 md:border-l md:border-gray-700/50 md:pl-8 md:-ml-2 pt-4 md:pt-0">
                            <CustomDropdown 
                                items={projectItems}
                                selectedId={projectId}
                                onSelect={handleProjectSelect}
                                icon={<FolderIcon className="w-5 h-5 text-gray-400" />}
                                label="프로젝트"
                            />
                            <CustomDropdown 
                                items={labelItems}
                                selectedId={labelId}
                                onSelect={handleLabelSelect}
                                icon={<TagIcon className="w-5 h-5 text-gray-400" />}
                                label="라벨"
                            />
                            
                            <div>
                                <label htmlFor="date-input" className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><CalendarIcon className="w-5 h-5" /> 날짜</label>
                                <input id="date-input" type="date" value={createdAt} onChange={e => setCreatedAt(e.target.value)} className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>

                            <div>
                                <label htmlFor="repeat-select" className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2"><RefreshIcon className="w-5 h-5" /> 반복</label>
                                <select id="repeat-select" value={repeat} onChange={e => setRepeat(e.target.value as Task['repeat'])} className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    <option value="none">반복 안함</option>
                                    <option value="daily">매일</option>
                                    <option value="weekdays">주중 매일</option>
                                    <option value="monthly">매월</option>
                                    <option value="yearly">매년</option>
                                </select>
                            </div>
                            
                            {repeat !== 'none' && (
                                <div className="animate-fade-in-fast">
                                    <label htmlFor="repeat-until-input" className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2">반복 종료일</label>
                                    <input id="repeat-until-input" type="date" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                    <p className="text-xs text-gray-500 mt-2">비워두면 무기한 반복됩니다.</p>
                                </div>
                            )}

                            <div className="border-t border-gray-700/50 pt-5 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setIsPeriodPopupOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 text-sm font-semibold text-gray-300 transition-colors"
                                >
                                    <CalendarDaysIcon className="w-5 h-5" />
                                    기간 설정으로 여러 날짜에 복제
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isPeriodPopupOpen && (
                <div className="fixed inset-0 bg-black/70 z-[51] flex items-center justify-center animate-fade-in" onClick={() => setIsPeriodPopupOpen(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h4 className="text-lg font-bold mb-4">기간 반복 설정</h4>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="period-start-date" className="block text-sm font-medium text-gray-400 mb-1">시작일</label>
                                <input id="period-start-date" type="date" value={periodStartDate} onChange={e => setPeriodStartDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label htmlFor="period-end-date" className="block text-sm font-medium text-gray-400 mb-1">종료일</label>
                                <input id="period-end-date" type="date" value={periodEndDate} onChange={e => setPeriodEndDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label htmlFor="period-frequency" className="block text-sm font-medium text-gray-400 mb-1">반복 주기</label>
                                <select id="period-frequency" value={periodFrequency} onChange={e => setPeriodFrequency(e.target.value as 'daily' | 'weekdays')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                    <option value="daily">매일</option>
                                    <option value="weekdays">주중 매일 (월-금)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsPeriodPopupOpen(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCreatePeriodTasks}
                                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg font-semibold transition-colors"
                            >
                                복제 생성
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskDetailModal;