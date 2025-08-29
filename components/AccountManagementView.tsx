import React from 'react';
import { User } from '../types';
import { UsersIcon } from './icons/Icons';

interface AccountManagementViewProps {
    currentUser: User;
    allUsers: User[];
    setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
    showConfirmation: (title: string, message: string, onConfirm: () => void, options?: { variant?: 'danger' | 'primary', confirmText?: string }) => void;
}

const AccountManagementView: React.FC<AccountManagementViewProps> = ({ currentUser, allUsers, setAllUsers, showConfirmation }) => {

    const toggleAdmin = (userToUpdate: User) => {
        const admins = allUsers.filter(u => u.isAdmin);
        if (userToUpdate.isAdmin && admins.length === 1) {
            showConfirmation(
                '권한 변경 불가',
                '마지막 관리자의 권한은 해제할 수 없습니다. 다른 사용자에게 먼저 관리자 권한을 부여하세요.',
                () => {},
                { variant: 'primary', confirmText: '확인' }
            );
            return;
        }

        const actionText = userToUpdate.isAdmin ? '해제' : '부여';
        const message = `'${userToUpdate.name}' 사용자의 관리자 권한을 ${actionText}하시겠습니까?`;

        showConfirmation(
            '관리자 권한 변경',
            message,
            () => {
                setAllUsers(prevUsers =>
                    prevUsers.map(u =>
                        u.id === userToUpdate.id ? { ...u, isAdmin: !u.isAdmin } : u
                    )
                );
            },
            { variant: 'primary', confirmText: '변경' }
        );
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-300 flex items-center gap-2">
                <UsersIcon className="w-6 h-6" />
                계정 관리
            </h3>
            <div className="space-y-3">
                {allUsers.map(user => (
                    <div key={user.id} className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                            <div>
                                <span className="font-semibold">{user.name}</span>
                                {user.id === currentUser.id && <span className="ml-2 text-xs text-sky-300">(나)</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {user.isAdmin ? (
                                <span className="text-sm font-bold bg-indigo-500 text-white rounded-full px-3 py-1">관리자</span>
                            ) : (
                                <span className="text-sm font-semibold text-gray-400">일반 사용자</span>
                            )}
                            <button
                                onClick={() => toggleAdmin(user)}
                                className={`text-sm font-semibold rounded px-3 py-1 transition-colors ${
                                    user.isAdmin ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {user.isAdmin ? '권한 해제' : '권한 부여'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccountManagementView;