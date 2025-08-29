import React, { useEffect, useRef } from 'react';
import { GoogleIcon } from './icons/Icons';

declare const google: any;

interface LoginPageProps {
  onLogin: (response: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const signInDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof google === 'undefined') {
            console.error("Google Identity Services 스크립트가 로드되지 않았습니다.");
            return;
        }

        // 중요: 이 부분에 실제 발급받은 Google Client ID를 입력해야 합니다.
        const GOOGLE_CLIENT_ID = "802814646338-ajmbskpflu2utqqe3gqg2k0bp15kakin.apps.googleusercontent.com";

        try {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: onLogin,
            });
    
            if (signInDivRef.current) {
                google.accounts.id.renderButton(
                    signInDivRef.current,
                    { theme: 'filled_black', size: 'large', type: 'standard', text: 'signin_with', shape: 'rectangular', logo_alignment: 'left' }
                );
            }
    
            // One-tap sign-in UI 표시 (선택 사항)
            // google.accounts.id.prompt();
        } catch (error) {
            console.error("Google 로그인 초기화 중 오류 발생:", error);
        }

    }, [onLogin]);


    return (
        <div className="min-h-screen bg-gray-900 font-sans text-gray-200 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md text-center bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-lg p-8 md:p-12 border border-gray-800">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 mb-4">
              ZenTask
            </h1>
            <p className="text-gray-400 mb-10 text-lg">
              자연어 기반으로 할 일을 손쉽게 관리하세요.
            </p>
            <div className="flex flex-col items-center gap-4">
                <div ref={signInDivRef} className="flex justify-center"></div>
                <p className="text-xs text-gray-600 mt-4 px-4">
                    이제 실제 Google 계정으로 로그인할 수 있습니다.
                </p>
            </div>
          </div>
        </div>
    );
};

export default LoginPage;