import React, { useEffect } from "react";
import FormSwitch from '@mui/material/Switch';
import FormControlLabel from "@mui/material/FormControlLabel";
import { createContext, useContext } from 'react';
import { NightshiftContext } from "./NightshiftProvider";

const Nightshift = React.forwardRef(() => { 
    const colorMode = useContext(NightshiftContext);

    const setTheme = (event:any) => {
        const val = event.target.checked
        colorMode.setColorMode(val ? 'dark' : 'light')
        setBodyClass(val)
    }

    const setBodyClass = (isDarkMode:boolean) => {
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
      setBodyClass(colorMode.theme.palette.mode == 'dark')
    }, []);

    return (
      <div className="is-flex is-flex-align-center nightshift-control">
          <FormControlLabel control={
            <FormSwitch checked={colorMode.theme.palette.mode == 'dark'} onChange={setTheme} />
          }
          labelPlacement="start"
          label="Nightshift" />
      </div>
    );
});

export default Nightshift;