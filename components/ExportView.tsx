import React, { useState } from 'react';
import { Task, Project, Label, DailyReport, MonthlyWorkReport } from '../types';
import { ArrowDownTrayIcon } from './icons/Icons';
import * as XLSX from 'xlsx';

interface ExportViewProps {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  dailyReports: DailyReport[];
  monthlyReports: MonthlyWorkReport[];
}

const ExportCard: React.FC<{ title: string; description: string; children: React.ReactNode; }> = ({ title, description, children }) => (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold text-sky-300 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        {children}
    </div>
);

const ExportView: React.FC<ExportViewProps> = ({ tasks, projects, labels, dailyReports, monthlyReports }) => {
    const getLocalTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getLocalThisMonthString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    };

    const today = getLocalTodayString();
    const thisMonth = getLocalThisMonthString();
    
    const [taskStartDate, setTaskStartDate] = useState(today);
    const [taskEndDate, setTaskEndDate] = useState(today);

    const [dailyReportStartDate, setDailyReportStartDate] = useState(today);
    const [dailyReportEndDate, setDailyReportEndDate] = useState(today);
    
    const [monthlyReportStart, setMonthlyReportStart] = useState(thisMonth);
    const [monthlyReportEnd, setMonthlyReportEnd] = useState(thisMonth);


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

    const handleExportTasksByPeriod = () => {
        const start = new Date(taskStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(taskEndDate);
        end.setHours(23, 59, 59, 999);

        const filteredTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= start && taskDate <= end;
        });

        const data = filteredTasks.map(task => ({
            'ID': task.id,
            '내용': task.content,
            '설명': task.description || '',
            '프로젝트': projects.find(p => p.id === task.projectId)?.name || '미지정',
            '라벨': labels.find(l => l.id === task.labelId)?.name || '미지정',
            '생성일': new Date(task.createdAt).toLocaleString('ko-KR'),
            '완료 여부': task.completed ? '완료' : '미완료',
        }));

        exportToExcel(data, `할일_기간별_${taskStartDate}_${taskEndDate}`);
    };

    const handleExportAllTasks = () => {
        if (tasks.length === 0) {
            alert("내보낼 데이터가 없습니다.");
            return;
        }
        const data = tasks.map(task => ({
            'ID': task.id,
            '내용': task.content,
            '설명': task.description || '',
            '프로젝트': projects.find(p => p.id === task.projectId)?.name || '미지정',
            '라벨': labels.find(l => l.id === task.labelId)?.name || '미지정',
            '생성일': new Date(task.createdAt).toLocaleString('ko-KR'),
            '완료 여부': task.completed ? '완료' : '미완료',
        }));
        exportToExcel(data, '할일_전체');
    };

    const handleExportDailyReportsByPeriod = () => {
        const start = new Date(dailyReportStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dailyReportEndDate);
        end.setHours(23, 59, 59, 999);

        const filteredReports = dailyReports.filter(report => {
            const reportDate = new Date(report.date);
            return reportDate >= start && reportDate <= end;
        });

        const data = filteredReports.flatMap(report =>
            report.tasks.map(task => ({
                '보고 날짜': report.date,
                '완료된 할 일': task.content,
                '프로젝트': projects.find(p => p.id === task.projectId)?.name || '미지정',
                '라벨': labels.find(l => l.id === task.labelId)?.name || '미지정',
            }))
        );
        exportToExcel(data, `일일_업무_보고_${dailyReportStartDate}_${dailyReportEndDate}`);
    };
    
    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const handleExportMonthlyReportsByPeriod = () => {
        const startYear = parseInt(monthlyReportStart.split('-')[0], 10);
        const startMonth = parseInt(monthlyReportStart.split('-')[1], 10) - 1;
        const endYear = parseInt(monthlyReportEnd.split('-')[0], 10);
        const endMonth = parseInt(monthlyReportEnd.split('-')[1], 10) - 1;

        const filteredReports = monthlyReports.filter(report => {
            const reportDate = new Date(report.year, report.month);
            const startDate = new Date(startYear, startMonth);
            const endDate = new Date(endYear, endMonth);
            return reportDate >= startDate && reportDate <= endDate;
        });
        
        const data = filteredReports.map(report => ({
            '년': report.year,
            '월': report.month + 1,
            '상태': report.status === 'submitted' ? '제출 완료' : '초안',
            '제출일': report.submittedAt ? new Date(report.submittedAt).toLocaleString('ko-KR') : '',
            '보고서 내용': stripHtml(report.content),
        }));
        exportToExcel(data, `월간_보고서_${monthlyReportStart}_${monthlyReportEnd}`);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-200 border-b-2 border-gray-700 pb-2 mb-6">데이터 내보내기</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ExportCard
                    title="기간별 할 일 내보내기"
                    description="선택한 기간 내의 모든 할 일을 Excel 파일로 내보냅니다."
                >
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <input
                            type="date"
                            value={taskStartDate}
                            onChange={(e) => setTaskStartDate(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                            type="date"
                            value={taskEndDate}
                            onChange={(e) => setTaskEndDate(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                         <button onClick={handleExportTasksByPeriod} className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            <span>내보내기</span>
                        </button>
                    </div>
                </ExportCard>
                
                <ExportCard
                    title="전체 할 일 내보내기"
                    description="지금까지의 모든 할 일을 하나의 Excel 파일로 내보냅니다."
                >
                     <button onClick={handleExportAllTasks} className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>전체 할 일 내보내기</span>
                    </button>
                </ExportCard>

                <ExportCard
                    title="기간별 일일 보고 내보내기"
                    description="선택한 기간 내에 제출했던 모든 일일 업무 보고 내역을 Excel 파일로 내보냅니다."
                >
                     <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <input
                            type="date"
                            value={dailyReportStartDate}
                            onChange={(e) => setDailyReportStartDate(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                            type="date"
                            value={dailyReportEndDate}
                            onChange={(e) => setDailyReportEndDate(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                         <button onClick={handleExportDailyReportsByPeriod} className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            <span>내보내기</span>
                        </button>
                    </div>
                </ExportCard>

                <ExportCard
                    title="기간별 월간 보고서 내보내기"
                    description="선택한 기간 내에 작성했던 모든 월간 보고서의 내용을 Excel 파일로 내보냅니다."
                >
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <input
                            type="month"
                            value={monthlyReportStart}
                            onChange={(e) => setMonthlyReportStart(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                            type="month"
                            value={monthlyReportEnd}
                            onChange={(e) => setMonthlyReportEnd(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                         <button onClick={handleExportMonthlyReportsByPeriod} className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            <span>내보내기</span>
                        </button>
                    </div>
                </ExportCard>

            </div>
        </div>
    );
};

export default ExportView;