import React, { useEffect, useRef, useState } from 'react';
import { GoogleIcon } from './icons/Icons';

declare const google: any;

interface LoginPageProps {
  onLogin: (response: any) => void;
  error: string | null;
}

const GOOGLE_CLIENT_ID = "802814646338-ajmbskpflu2utqqe3gqg2k0bp15kakin.apps.googleusercontent.com";

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
    const signInDivRef = useRef<HTMLDivElement>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    // This effect runs once to check for the Google script.
    useEffect(() => {
        const checkGoogleScript = () => {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                setScriptLoaded(true);
                return true;
            }
            return false;
        };

        if (checkGoogleScript()) {
            return;
        }

        const intervalId = setInterval(() => {
            if (checkGoogleScript()) {
                clearInterval(intervalId);
            }
        }, 200);

        return () => clearInterval(intervalId);
    }, []);

    // This effect runs when the script is loaded.
    useEffect(() => {
        if (!scriptLoaded || !signInDivRef.current) {
            return;
        }

        try {
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
        } catch (err) {
            console.error("Google 로그인 초기화 중 오류 발생:", err);
            setInitError("Google 로그인 버튼을 불러오는 데 실패했습니다. 페이지를 새로고침 해주세요.");
        }
    }, [scriptLoaded, onLogin]);


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
                {initError && <p className="text-sm text-red-400 mt-4 px-4">{initError}</p>}
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
