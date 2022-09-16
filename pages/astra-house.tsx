import React, { useContext } from "react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import Nightshift from "../components/Nightshift";
import PublicSection from '../components/PublicSection';
import Marketplaces from '../components/Marketplaces';
import AstraHouseEvents from '../sections/AstraHouse/Events';
import AstraHouseMyRaffles from '../sections/AstraHouse/MyRaffles';
import HeadElement from '../components/HeadElement';

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

const AstraHouse = React.forwardRef((nftFunctions, ref) => {
  const { publicKey, wallet, sendTransaction, signTransaction } = useWallet();
  const [sectionValue, setSectionValue] = React.useState<string>('events');
  

  const handleSectionChange = (event:any, newValue:string) => {
    setSectionValue(newValue);
  };
  
  return wallet ? (
    <>
      <HeadElement />

      <div>
        <div className="title-bar p-md main-content-wrapper">
          <div className="container main-content-wrapper">
            <h1 className="has-text-white has-font-tomo has-text-shadow">Astra House</h1>
            <Nightshift />
          </div>
        </div>
        <main className="container main-content-wrapper main-wrapper m-t-md">
          <Grid columns={24} container justifyContent="space-between" alignItems="center">
            <Grid item>
                <Box className="m-b-md">
                <Tabs value={sectionValue} onChange={handleSectionChange} aria-label="Grim sections" textColor="secondary" indicatorColor="primary">
                  <Tab value="events" label={`Events`} />
                  <Tab value="my_raffles" label={`My Raffles`} />
                  {/*
                  <Tab value="leaderboard" label={`Leaderboard`} />
                  */}
                </Tabs>
                </Box>
            </Grid>
          </Grid>


          {sectionValue == 'events' && <AstraHouseEvents />}
          {sectionValue == 'my_raffles' && <AstraHouseMyRaffles />}
          {/*
          {sectionValue == 'leaderboard' && <div></div>}
          */}
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

export default AstraHouse;