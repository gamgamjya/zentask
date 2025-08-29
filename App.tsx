import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { User } from './types';
import LoginPage from './components/LoginPage';
import MainApp from './MainApp';

// JWT 토큰을 디코딩하는 간단한 유틸리티 함수
function jwtDecode(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
}

declare const google: any;

const App: React.FC = () => {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [allUsers, setAllUsers] = useLocalStorage<User[]>('all_users', []);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = (credentialResponse: any) => {
    setLoginError(null); // 새로운 로그인 시도 시 오류 초기화
    const decoded: { sub: string; name: string; picture: string; email: string; } | null = jwtDecode(credentialResponse.credential);
    if (!decoded) {
      setLoginError("로그인 정보를 해석할 수 없습니다. 다시 시도해주세요.");
      return;
    }
    
    const { sub, name, picture, email } = decoded;

    // 도메인 검사
    if (!email || !email.endsWith('@parable-asia.com')) {
      setLoginError('parable-asia.com 도메인 계정으로만 로그인할 수 있습니다.');
      if (typeof google !== 'undefined') {
        google.accounts.id.disableAutoSelect();
      }
      setUser(null); // 잘못된 계정 자동 로그인을 방지하기 위해 사용자 상태를 null로 설정
      return;
    }

    let userToLogin = allUsers.find(u => u.id === sub);

    if (!userToLogin) {
      // 앱의 첫 사용자를 관리자로 지정
      const isAdmin = allUsers.length === 0;
      const newUser: User = { id: sub, name, picture, email, isAdmin };
      setAllUsers(prevUsers => [...prevUsers, newUser]);
      userToLogin = newUser;
    }

    setUser(userToLogin);
  };

  const handleLogout = () => {
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  return <MainApp user={user} onLogout={handleLogout} setUser={setUser} allUsers={allUsers} setAllUsers={setAllUsers} />;
};

export default App;