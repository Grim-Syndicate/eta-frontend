import React, { useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import PublicSection from '../components/PublicSection';
import Marketplaces from '../components/Marketplaces';
import SectionAvailableQuests from "../sections/SectionAvailableQuests";
import Nightshift from "../components/Nightshift";

const FieldWork = React.forwardRef((nftFunctions, ref) => { 
    const { wallet } = useWallet();
    const [sectionValue, setSectionValue] = useState('available');

    const handleSectionChange = (event:any, newValue:string) => {
      setSectionValue(newValue);
    };

    return wallet ? (
      <>
        <div>
          <div className="title-bar p-md main-content-wrapper">
            <div className="container main-content-wrapper">
              <h1 className="has-text-white has-font-tomo has-text-shadow">Field Work</h1>
              <Nightshift />
            </div>
          </div>
          <main className="container main-content-wrapper main-wrapper is-reverse m-t-md">
            <Grid container direction={'column'}>
              <Grid item>
                  <Box className="m-b-md">
                  <Tabs value={sectionValue} onChange={handleSectionChange} aria-label="Grim sections" textColor="secondary" indicatorColor="primary">
                    <Tab value="available" label={`Available Assignments`} />
                  </Tabs>
                  </Box>
              </Grid>

              {sectionValue == 'available' && <SectionAvailableQuests/>}

            </Grid>
          </main>
        </div>
      </>
    ) : (
    <div className="container main-content-wrapper">
      <div className="m-t-md"><PublicSection /></div>
      <Marketplaces />
    </div>
    );
});

export default FieldWork;