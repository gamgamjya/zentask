import React from 'react';
import { createPortal } from 'react-dom';
import { User, MonthlyWorkReport } from '../types';
import { XIcon, PrinterIcon } from './icons/Icons';

interface UserMonthlyReportDetailModalProps {
    user: User;
    report: MonthlyWorkReport;
    onClose: () => void;
}

const UserMonthlyReportDetailModal: React.FC<UserMonthlyReportDetailModalProps> = ({ user, report, onClose }) => {
    
    const handlePrint = () => {
        const printContent = document.getElementById('printable-report-content');
        if (printContent) {
            const reportTitle = `<h2>${user.name} - ${report.year}년 ${report.month + 1}월 업무 보고서</h2>`;
            const newWindow = window.open('', '_blank');
            newWindow?.document.write(`
                <html>
                    <head>
                        <title>업무 보고서 인쇄</title>
                        <style>
                            body { font-family: sans-serif; line-height: 1.6; color: #333; }
                            h2, h3 { color: #111; }
                            hr { border: 0; border-top: 1px solid #ccc; }
                            ul { padding-left: 20px; }
                            li { margin-bottom: 5px; }
                        </style>
                    </head>
                    <body>
                        ${reportTitle}
                        <div class="report-content">
                         ${printContent.innerHTML}
                        </div>
                    </body>
                </html>
            `);
            newWindow?.document.close();
            newWindow?.print();
        }
    };

    const portalRoot = document.getElementById('portal-root');
    if(!portalRoot) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-xl w-full max-w-3xl p-6 m-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-sky-300">
                        {user.name} - {report.year}년 {report.month + 1}월 상세 보고서
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="p-2 text-gray-300 hover:text-white rounded-full transition-colors bg-gray-700 hover:bg-gray-600" title="인쇄">
                            <PrinterIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full transition-colors">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
                <div id="printable-report-content" className="flex-grow overflow-y-auto pr-2 bg-gray-950/70 p-4 rounded-md border border-gray-700">
                    <div
                        className="text-gray-200 font-sans text-sm report-viewer"
                        dangerouslySetInnerHTML={{ __html: report.content }}
                    />
                </div>
            </div>
        </div>,
        portalRoot
    );
};

export default UserMonthlyReportDetailModal;