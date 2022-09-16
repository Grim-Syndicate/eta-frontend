import React, { useState, useRef, useContext } from 'react'
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import FormControlLabel from "@mui/material/FormControlLabel";
import FormSwitch from '@mui/material/Switch';
import { GrimsContext } from './GrimsProvider';
import { NightshiftContext } from './NightshiftProvider';
import Link from 'next/link';

const Nav = () => {  
  const { isUsingLedger, setIsUsingLedger } = useContext(GrimsContext)
  const { theme } = useContext(NightshiftContext)
  
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const handleOpenMobileMenu = () => {
      setIsOpenMobileMenu(!isOpenMobileMenu)
  };

  const nftListRef = useRef();


return (
    <>
    <header className="mobile-app-bar">
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar className="is-flex-justify-space-between">
                    <div className='is-text-centered'>
                        <img src={ theme.palette.mode == 'light' ? "/img/logo_eta.svg" : "/img/logo_eta_white.svg"} alt="ETA logo" className="logo-eta img-fluid" />
                    </div>

                    <button className="mobile-menu-button button is-small" onClick={handleOpenMobileMenu}>
                        Menu
                    </button>
                </Toolbar>
            </AppBar>
        </Box>
    </header>

    {isOpenMobileMenu && <ul className={ theme.palette.mode == 'light' ? "mobile-menu" : 'mobile-menu dark'}>
        <li><Link href="/"><a className="navbar-nav-item">Dashboard</a></Link></li>
        <li><Link href="/office"><a className="navbar-nav-item">Office</a></Link></li>
        <li><Link href="/field-work"><a className="navbar-nav-item">Field Work</a></Link></li>
        <li><Link href="/astra-house"><a className="navbar-nav-item">Astra House</a></Link></li>
        <li><Link href="/ballot-box"><a className="navbar-nav-item">Ballot Box</a></Link></li>
        <li className='m-t-lg'>
            <WalletMultiButton className="wallet-adapter-button-custom m-b-sm" />
            <div>
                <FormControlLabel sx={{ color: theme.palette.mode == 'light' ? '#000' : '#fff' }} control={
                    <FormSwitch checked={isUsingLedger} onChange={(e) => {
                        setIsUsingLedger(e.target.checked)
                    }}/>
                }
                labelPlacement="start"
                label="Use Ledger" />
            </div>
        </li>
    </ul>}

    <AppBar position='static' >
        <Toolbar disableGutters className='header-main'>
        <div className='is-text-centered'>
            <img src={ theme.palette.mode == 'light' ? "/img/logo_eta.svg" : "/img/logo_eta_white.svg"} alt="ETA logo" className="logo-eta img-fluid" />
        </div>

        <div className="navbar">
            <Link href="/"><a className="navbar-nav-item">Dashboard</a></Link>
            <Link href="/office"><a className="navbar-nav-item">Office</a></Link>
            <Link href="/field-work"><a className="navbar-nav-item">Field Work</a></Link>
            <Link href="/astra-house"><a className="navbar-nav-item">Astra House</a></Link>
            <Link href="/ballot-box"><a className="navbar-nav-item">Ballot Box</a></Link>
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
        </Toolbar>
    </AppBar>
    </>
)}

export default Nav