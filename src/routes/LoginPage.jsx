import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Content } from '@carbon/react';
import styles from './LoginPage.module.scss';

import MainHeader from '@/Components/MainHeader';
import LoginFormEmailStep from '@/Components/LoginFormEmailStep';
import LoginFormPasswordStep from '@/Components/LoginFormPasswordStep';

import useAuth from '@/hooks/useAuth';

function LoginPage() {

    const { user, login } = useAuth();
    const [email, setEmail] = useState(null);
    const [rememberId, setRememberId] = useState(null);
    const [errorText, setErrorText] = useState(null);
    const inputRef = useRef();
    const navigate = useNavigate();

    const handleEmailSubmit = () => {
        if(inputRef.current.validate()) {
            setRememberId(inputRef.current.rememberIdChecked);
            setEmail(inputRef.current.value);
        } else {
            setEmail(null);
        }
    };

    const getPassword = async () => {
        if(inputRef.current.validate()) {

            try {
                await login({ email: email, password: inputRef.current.value }, { persist: rememberId });
                navigate('/', {replace: true});
            } catch(error) {
                console.log(error);
                if(error?.response?.status === 401) {
                    setErrorText('Incorrect email or password. Try again.');
                } else {
                    setErrorText('Unknown error occurred. Try again.');
                }
            }

        }
    };

    if(user) {
        navigate('/', {replace: true});
    }

    return (
        <>
            <MainHeader />
            <Content>
                <div className={styles.loginFormContainer}>
                    { email ?
                        <LoginFormPasswordStep email={email} onSubmit={getPassword} errorText={errorText} setErrorText={setErrorText} ref={inputRef} /> :
                        <LoginFormEmailStep onSubmit={handleEmailSubmit} ref={inputRef} />
                    }
                </div>
            </Content>
        </>
    );
}

export default LoginPage;