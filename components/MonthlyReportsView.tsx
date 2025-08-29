import React, { useState } from 'react';
import { User, MonthlyWorkReport } from '../types';
import UserMonthlyReportDetailModal from './UserMonthlyReportDetailModal';
import { DocumentTextIcon, ArrowDownTrayIcon } from './icons/Icons';
import * as XLSX from 'xlsx';

interface MonthlyReportsViewProps {
    allUsers: User[];
    monthlyReports: MonthlyWorkReport[];
}

const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

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

const MonthlyReportsView: React.FC<MonthlyReportsViewProps> = ({ allUsers, monthlyReports }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedReportInfo, setSelectedReportInfo] = useState<{ user: User, report: MonthlyWorkReport } | null>(null);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const goToThisMonth = () => {
        setCurrentDate(new Date());
    };

    const submittedReportsForMonth = monthlyReports.filter(r => 
        r.year === currentYear && 
        r.month === currentMonth &&
        r.status === 'submitted'
    );
    
    const handleDownloadAllMonthlyReports = () => {
        const data = submittedReportsForMonth.map(report => {
            const user = allUsers.find(u => u.id === report.userId);
            return {
                '보고자': user?.name || '알 수 없음',
                '년': report.year,
                '월': report.month + 1,
                '제출일': report.submittedAt ? new Date(report.submittedAt).toLocaleString('ko-KR') : '',
                '보고서 내용': stripHtml(report.content),
            };
        });
        exportToExcel(data, `월간_보고서_전체_${currentYear}-${currentMonth + 1}`);
    };

    const handleDownloadUserMonthlyReport = (report: MonthlyWorkReport) => {
        const user = allUsers.find(u => u.id === report.userId);
        const data = [{
            '년': report.year,
            '월': report.month + 1,
            '상태': report.status === 'submitted' ? '제출 완료' : '초안',
            '제출일': report.submittedAt ? new Date(report.submittedAt).toLocaleString('ko-KR') : '',
            '보고서 내용': stripHtml(report.content),
        }];
        exportToExcel(data, `월간_보고서_${user?.name || '사용자'}_${report.year}-${report.month + 1}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                 <h3 className="text-xl font-bold text-gray-300 flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6" />
                    월간 보고 현황
                 </h3>
                 <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-lg text-gray-300 min-w-[150px] text-right">
                            {currentDate.toLocaleString('ko-KR', { month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">&lt;</button>
                            <button onClick={goToThisMonth} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm font-semibold">이번 달</button>
                            <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">&gt;</button>
                        </div>
                    </div>
                    <button 
                        onClick={handleDownloadAllMonthlyReports}
                        className="flex items-center gap-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={submittedReportsForMonth.length === 0}
                        title="해당월 전체 보고서 다운로드"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>전체 다운로드</span>
                    </button>
                </div>
            </div>
            <div className="space-y-3">
                {allUsers.map(user => {
                    const report = monthlyReports.find(r => r.userId === user.id && r.year === currentYear && r.month === currentMonth);
                    
                    let statusText, statusColor;
                    if (report?.status === 'submitted') {
                        statusText = '보고 완료';
                        statusColor = 'text-emerald-400';
                    } else if (report?.status === 'draft') {
                        statusText = '작성 중';
                        statusColor = 'text-amber-400';
                    } else {
                        statusText = '미작성';
                        statusColor = 'text-gray-500';
                    }

                    return (
                        <div key={user.id} className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                                <div>
                                    <span className="font-semibold">{user.name}</span>
                                    {user.isAdmin && <span className="ml-2 text-xs font-bold bg-indigo-500 text-white rounded-full px-2 py-0.5">관리자</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                                <span className={`text-sm font-semibold ${statusColor}`}>{statusText}</span>
                                {report?.status === 'submitted' && (
                                    <button
                                        onClick={() => handleDownloadUserMonthlyReport(report)}
                                        className="text-xs bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 flex items-center gap-1"
                                        title="개별 보고서 다운로드"
                                    >
                                        <ArrowDownTrayIcon className="w-3 h-3" />
                                        <span>다운로드</span>
                                    </button>
                                )}
                                <button 
                                    onClick={() => report && setSelectedReportInfo({ user, report })}
                                    className="text-sm bg-gray-700 hover:bg-gray-600 rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!report}
                                >
                                    상세 보고서 보기
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedReportInfo && (
                <UserMonthlyReportDetailModal 
                    user={selectedReportInfo.user}
                    report={selectedReportInfo.report}
                    onClose={() => setSelectedReportInfo(null)}
                />
            )}
        </div>
    );
};

export default MonthlyReportsView;