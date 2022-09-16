import React from "react";
import { useWallet } from '@solana/wallet-adapter-react';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import Nightshift from "../components/Nightshift";
import PublicSection from '../components/PublicSection';
import Marketplaces from '../components/Marketplaces';
import HeadElement from '../components/HeadElement';
import Proposals from "../sections/BallotBox/Proposals";

const BallotBox = React.forwardRef((nftFunctions, ref) => {
  const { wallet } = useWallet();
  const [sectionValue, setSectionValue] = React.useState<string>('proposals');
  

  const handleSectionChange = (event:any, newValue:string) => {
    setSectionValue(newValue);
  };
  
  return wallet ? (
    <>
      <HeadElement />

      <div>
        <div className="title-bar p-md main-content-wrapper">
          <div className="container main-content-wrapper">
            <h1 className="has-text-white has-font-tomo has-text-shadow">Ballot Box</h1>
            <Nightshift />
          </div>
        </div>
        <main className="container main-content-wrapper main-wrapper m-t-md">
          <Grid columns={24} container justifyContent="space-between" alignItems="center">
            <Grid item>
                <Box className="m-b-md">
                <Tabs value={sectionValue} onChange={handleSectionChange} aria-label="Grim sections" textColor="secondary" indicatorColor="primary">
                  <Tab value="proposals" label={`Proposals`} />
                </Tabs>
                </Box>
            </Grid>
          </Grid>
          {sectionValue == 'proposals' && <Proposals />}
        </main>
      </div>
    </>
  ) : (
    <>
    <HeadElement />
     <div className="container main-content-wrapper">
      <div className="m-t-md"><PublicSection /></div>
      <Marketplaces />
    </div>
    </>
  );
});

export default BallotBox;