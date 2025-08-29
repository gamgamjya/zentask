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
                const GOOGLE_CLIENT_ID = "802814646338-ajmbskpflu2utqqe3gqg2k0bp15kakin.apps.googleusercontent.com";

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
            } catch (err) {
                console.error("Google 로그인 초기화 중 오류 발생:", err);
                if(signInDivRef.current) {
                    signInDivRef.current.innerText = "Google 로그인 버튼을 불러오는 데 실패했습니다.";
                }
                return true; // Stop trying on error
            }
        };

        // Attempt to render the button immediately. If the google script is not ready,
        // set up an interval to keep trying.
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