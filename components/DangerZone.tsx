import React, { useState } from 'react';
import { TrashIcon, WarningIcon, ChevronDownIcon } from './icons/Icons';

interface DangerZoneProps {
    onDeleteAllTasks: () => void;
    onDeleteAllProjects: () => void;
    onDeleteAllLabels: () => void;
    showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

const DangerZone: React.FC<DangerZoneProps> = ({ onDeleteAllTasks, onDeleteAllProjects, onDeleteAllLabels, showConfirmation }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleDeleteTasks = () => {
        showConfirmation(
            '모든 할 일 삭제',
            '정말 모든 할 일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            onDeleteAllTasks
        );
    };
    
    const handleDeleteProjects = () => {
        showConfirmation(
            '모든 프로젝트 삭제',
            '정말 모든 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다. 관련된 라벨과 할 일의 연결도 초기화됩니다.',
            onDeleteAllProjects
        );
    };

    const handleDeleteLabels = () => {
        showConfirmation(
            '모든 라벨 삭제',
            '정말 모든 라벨을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다. 관련된 할 일의 연결도 초기화됩니다.',
            onDeleteAllLabels
        );
    };

    return (
        <div className="bg-red-900/30 rounded-lg border border-red-500/40 mt-8">
             <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <WarningIcon className="w-6 h-6 text-red-400" />
                    <h3 className="text-xl font-bold text-red-400">
                        위험 구역
                    </h3>
                </div>
                 <ChevronDownIcon className={`w-6 h-6 text-red-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-4 pb-4 space-y-4 animate-fade-in-fast">
                    <DangerAction
                        title="모든 할 일 삭제"
                        description="모든 프로젝트와 라벨에 있는 모든 할 일을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다."
                        buttonText="모든 할 일 삭제"
                        onAction={handleDeleteTasks}
                    />
                     <DangerAction
                        title="모든 프로젝트 삭제"
                        description="모든 프로젝트를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다."
                        buttonText="모든 프로젝트 삭제"
                        onAction={handleDeleteProjects}
                    />
                     <DangerAction
                        title="모든 라벨 삭제"
                        description="모든 글로벌 및 프로젝트 라벨을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다."
                        buttonText="모든 라벨 삭제"
                        onAction={handleDeleteLabels}
                    />
                </div>
            )}
        </div>
    );
};

interface DangerActionProps {
    title: string;
    description: string;
    buttonText: string;
    onAction: () => void;
}

const DangerAction: React.FC<DangerActionProps> = ({ title, description, buttonText, onAction }) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-3 border-t border-red-500/20">
        <div>
            <p className="font-semibold text-red-300">{title}</p>
            <p className="text-sm text-gray-400 max-w-lg">
                {description}
            </p>
        </div>
        <button 
            onClick={onAction}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
        >
            <TrashIcon className="w-5 h-5" />
            <span>{buttonText}</span>
        </button>
    </div>
);


export default DangerZone;