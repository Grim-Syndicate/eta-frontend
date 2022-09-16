import React, { useEffect } from "react";
import FormSwitch from '@mui/material/Switch';
import FormControlLabel from "@mui/material/FormControlLabel";
import { createContext, useContext } from 'react';
import { NightshiftContext } from "./NightshiftProvider";

const Nightshift = React.forwardRef(() => { 
    const [isDarkModeEnabled, setChecked] = React.useState(false)
    const colorMode = useContext(NightshiftContext);

    const setTheme = (event:any) => {
        const val = event.target.checked
        setChecked(val);
        const body = document.querySelector('body')
        
        if (val) {
          setBodyClass(true)
          return
        }

        setBodyClass(false)
    }

    const setBodyClass = (isDarkMode:boolean) => {
      colorMode.toggleColorMode()
      const body = document.querySelector('body')
      
      if(!body) return
      
      if (isDarkMode) {
        body.className = 'dark-mode'
        window.localStorage.setItem('theme', 'dark')
        return
      }

      body.className = ''
      window.localStorage.setItem('theme', 'light')
    }

    useEffect(() => {
      const currentTheme = window.localStorage.getItem('theme') || 'light'

      if (!currentTheme || currentTheme === 'light') {
        setChecked(false)
        setBodyClass(false)
        return
      }

      setChecked(true)
      setBodyClass(true)
    }, []);

    return (
      <div className="is-flex is-flex-align-center nightshift-control">
          <FormControlLabel control={
            <FormSwitch checked={isDarkModeEnabled} onChange={setTheme} />
          }
          labelPlacement="start"
          label="Nightshift" />
      </div>
    );
});

export default Nightshift;