import { createContext, useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Theme } from '@carbon/react';

const AppThemeContext = createContext([null, () => { }]);

const LOCAL_STORAGE_THEME_KEY = 'theme';

function useAppTheme() {
    const [theme, setTheme] = useContext(AppThemeContext);
    return [theme, setTheme];
}

function AppThemeProvider(props) {
    const [theme, setTheme] = useState();

    useEffect(
        () => {
            if (theme) {
                localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
            } else {
                const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
                setTheme(storedTheme ? storedTheme : 'white');
            }
        }, [theme, setTheme]
    );

    return (
        <AppThemeContext.Provider value={[theme, setTheme]}>
            <Theme theme={theme}>
                {
                    theme === 'g100' &&
                    <Helmet>
                        <style>{'body { background-color: #161616; }'}</style>
                    </Helmet>
                }
                {props.children}
            </Theme>
        </AppThemeContext.Provider>
    );
}

export default useAppTheme;
export { AppThemeProvider };