import React, { useEffect, useRef } from 'react';

declare const google: any;

interface LoginPageProps {
  onLogin: (response: any) => void;
  error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  const signInDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const GOOGLE_CLIENT_ID = "802814646338-ajmbskpflu2utqqe3gqg2k0bp15kakin.apps.googleusercontent.com";
    
    // 이 함수는 Google 로그인 버튼을 초기화하고 렌더링하려고 시도합니다.
    // 'google' 객체가 스크립트에서 아직 사용 가능하지 않은 경우 재시도합니다.
    const initializeGoogleSignIn = () => {
      if (typeof google !== 'undefined' && google.accounts?.id && signInDivRef.current) {
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: onLogin,
            use_fedcm_for_prompt: true, // FedCM을 활성화하여 COOP/COEP 정책 문제를 해결
          });
          
          google.accounts.id.renderButton(
            signInDivRef.current,
            { theme: 'filled_black', size: 'large', type: 'standard', text: 'signin_with', shape: 'rectangular', logo_alignment: 'left' } 
          );
        } catch (err) {
          console.error("Google 로그인 초기화 중 오류 발생:", err);
        }
      } else {
        // 스크립트가 아직 로드되지 않았다면 100ms 후에 재시도합니다.
        setTimeout(initializeGoogleSignIn, 100);
      }
    };
    
    initializeGoogleSignIn();

  }, [onLogin]);

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-200 flex items-center justify-center p-4 animate-fade-in bg-gradient-to-br from-gray-950 via-gray-950 to-sky-900/20">
      <div className="w-full max-w-md text-center bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-lg p-8 md:p-12 border border-gray-800">
        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 mb-4">
          ZenTask
        </h1>
        <p className="text-gray-400 mb-10 text-lg">
          자연어 기반으로 할 일을 손쉽게 관리하세요.
        </p>
        <div className="flex flex-col items-center gap-4">
          <div ref={signInDivRef} className="flex justify-center"></div>
          {error && (
            <p className="text-sm text-red-400 mt-4 px-4">{error}</p>
          )}
          <p className="text-xs text-gray-600 mt-4 px-4">
            @parable-asia.com 계정으로 로그인해주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;