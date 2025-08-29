import React, { useEffect, useRef } from 'react';
import { GoogleIcon } from './icons/Icons';

declare const google: any;

interface LoginPageProps {
  onLogin: (response: any) => void;
  error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
    const signInDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const renderGoogleButton = () => {
            if (typeof google === 'undefined' || !signInDivRef.current) {
                return false; // Not ready yet
            }

            try {
                // !!! 중요 !!!
                // 아래 "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" 부분을
                // Google Cloud Console에서 발급받은 실제 클라이언트 ID로 교체해주세요.
                const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

                if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
                    console.error("Google Client ID가 설정되지 않았습니다. LoginPage.tsx 파일을 열어 ID를 입력해주세요.");
                    if(signInDivRef.current) {
                        signInDivRef.current.innerText = "Google 로그인 설정이 필요합니다. 코드를 수정해주세요.";
                    }
                    return true; // Stop trying
                }

                google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: onLogin,
                });
        
                if (signInDivRef.current.childElementCount === 0) {
                    google.accounts.id.renderButton(
                        signInDivRef.current,
                        { theme: 'filled_black', size: 'large', type: 'standard', text: 'signin_with', shape: 'rectangular', logo_alignment: 'left' }
                    );
                }
                return true; // Success
            } catch (error) {
                console.error("Google 로그인 초기화 중 오류 발생:", error);
                return true; // Stop trying on error
            }
        };

        if (renderGoogleButton()) {
            return;
        }

        const intervalId = setInterval(() => {
            if (renderGoogleButton()) {
                clearInterval(intervalId);
            }
        }, 200);

        return () => clearInterval(intervalId);

    }, [onLogin]);


    return (
        <div className="min-h-screen bg-gray-900 font-sans text-gray-200 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md text-center bg-gray-900/50 backdrop-blur-xl rounded-22xl shadow-lg p-8 md:p-12 border border-gray-800">
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