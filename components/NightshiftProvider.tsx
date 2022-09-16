import { createTheme, ThemeProvider, Theme } from "@mui/material/styles";
import { createContext, useEffect, useState, useMemo } from "react";

const NightshiftContext = createContext({ 
    toggleColorMode: () => {},
    theme: createTheme()
});

function NightshiftProvider({ children }:any) {
    const [mode, setMode] = useState<'light' | 'dark'>('light');

    const setColorMode = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    }
    
    const theme = useMemo(
    () => createTheme({
        palette: {
            mode,
            primary: {
              main: '#d63a3a'
            },
            secondary: {
              main: '#111'
            },
        },
        typography: {
            fontFamily: `"Nunito", "Helvetica", "Arial", sans-serif`,
            fontSize: 16,
            button: {
              textTransform: 'none',
            }
        },
        components:{
            MuiAppBar:{
                styleOverrides: {
                    colorPrimary: {
                        color: mode == 'light' ? '#000' : '#fff',
                        backgroundColor: mode == 'light' ? '#fff' : '#000'
                    },
                }
            },
            MuiFormControlLabel:{
                styleOverrides:{
                    label: {
                        fontSize: 14
                    }
                }
            }
        }
    }), [mode]);

    useEffect(() => {
        const currentTheme = window.localStorage.getItem('theme') || 'light'
        if(currentTheme == 'dark' || currentTheme == 'light'){
            setMode(currentTheme)
        }
    }, []);

    return (
        <NightshiftContext.Provider value={{
            toggleColorMode:setColorMode,
            theme
        }}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </NightshiftContext.Provider>
      );
    }
    
export { NightshiftProvider, NightshiftContext };