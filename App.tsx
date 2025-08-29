import React from 'react';
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

const App: React.FC = () => {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [allUsers, setAllUsers] = useLocalStorage<User[]>('all_users', []);

  const handleLogin = (credentialResponse: any) => {
    const decoded: { sub: string; name: string; picture: string; email: string; } | null = jwtDecode(credentialResponse.credential);
    if (!decoded) {
      // TODO: 사용자에게 디코딩 실패를 알리는 알림 추가
      return;
    }
    
    const { sub, name, picture, email } = decoded;

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
    setUser(null);
    // 실제 프로덕션 환경에서는 google.accounts.id.disableAutoSelect() 등을 호출하여
    // Google 세션에서도 로그아웃 처리를 할 수 있습니다.
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <MainApp user={user} onLogout={handleLogout} setUser={setUser} allUsers={allUsers} setAllUsers={setAllUsers} />;
};

export default App;