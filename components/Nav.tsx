import React, { useState, useRef, useContext } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import FormControlLabel from "@mui/material/FormControlLabel";
import FormSwitch from '@mui/material/Switch';
import { GrimsContext } from './GrimsProvider';

const Nav = () => {  
  const { isUsingLedger, setIsUsingLedger } = useContext(GrimsContext)

  const theme = createTheme({
      palette: {
          primary: {
              main: '#fff'
          }
      }
  });
  
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const handleOpenMobileMenu = () => {
      setIsOpenMobileMenu(!isOpenMobileMenu)
  };

  const nftListRef = useRef();


return (
    <>
    <header className="mobile-app-bar">
        <ThemeProvider theme={theme}>
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static">
                    <Toolbar className="is-flex-justify-space-between">
                        <div className='is-text-centered'>
                            <img src="/img/logo_eta.svg" alt="ETA logo" className="logo-eta img-fluid" />
                        </div>

                        <button className="mobile-menu-button button is-small" onClick={handleOpenMobileMenu}>
                            Menu
                        </button>
                    </Toolbar>
                </AppBar>
            </Box>
        </ThemeProvider>
    </header>

    {isOpenMobileMenu && <ul className="mobile-menu">
        <li><a href="/" className="navbar-nav-item">Dashboard</a></li>
        <li><a href="/office" className="navbar-nav-item">Office</a></li>
        <li><a href="/field-work" className="navbar-nav-item">Field Work</a></li>
        <li><a href="/astra-house" className="navbar-nav-item">Astra House</a></li>
        <li><a href="/" className="navbar-nav-item navbar-nav-item--inactive">Locker</a></li>
        <li className='m-t-lg'>
            <WalletMultiButton className="wallet-adapter-button-custom m-b-sm" />
            <div>
                <FormControlLabel control={
                    <FormSwitch checked={isUsingLedger} onChange={(e) => {
                        setIsUsingLedger(e.target.checked)
                    }}/>
                }
                labelPlacement="start"
                label="Use Ledger" />
            </div>
        </li>
    </ul>}

    <header className="header-main has-background-white">
        <div className='is-text-centered'>
            <img src="/img/logo_eta.svg" alt="ETA logo" className="logo-eta img-fluid" />
        </div>

        <div className="navbar">
            <a href="/" className="navbar-nav-item">Dashboard</a>
            <a href="/office" className="navbar-nav-item">Office</a>
            <a href="/field-work" className="navbar-nav-item">Field Work</a>
            <a href="/astra-house" className="navbar-nav-item">Astra House</a>
            <a href="/" className="navbar-nav-item navbar-nav-item--inactive">Locker</a>
        </div>

        <div className="is-flex is-flex-align-center">
            <FormControlLabel control={
                <FormSwitch checked={isUsingLedger} onChange={(e) => {
                    setIsUsingLedger(e.target.checked)
                }}/>
            }
            labelPlacement="start"
            label="Use Ledger" />
            <WalletMultiButton className="wallet-adapter-button-custom m-l-md" />
        </div>
    </header>
    </>
)}

export default Nav