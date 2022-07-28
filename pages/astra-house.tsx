import React, { useContext } from "react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Nightshift from "../components/Nightshift";
import PublicSection from '../components/PublicSection';
import Marketplaces from '../components/Marketplaces';
import AstraHouseEvents from '../sections/AstraHouse/Events';
import AstraHouseMyRaffles from '../sections/AstraHouse/MyRaffles';
import { GrimsContext } from "../components/GrimsProvider";
import { AstraAuction, AstraRaffle } from "../models/AstraHouse";
import ManageRaffle from "../components/ManageRaffle";
import ManageAuction from "../components/ManageAuction";
import HeadElement from '../components/HeadElement';

const tabTheme = createTheme({
  palette: {
    primary: {
      main: '#d63a3a'
    },
    secondary: {
      main: '#111'
    }
  },
  typography: {
    fontFamily: `"Nunito", "Helvetica", "Arial", sans-serif`,
    fontSize: 16,
    button: {
      textTransform: 'none',
    }
  }
});

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

const AstraHouse = React.forwardRef((nftFunctions, ref) => { 
  const { canCreateRaffle } = useContext(GrimsContext)
  const { publicKey, wallet, sendTransaction, signTransaction } = useWallet();
  const [sectionValue, setSectionValue] = React.useState<string>('events');
  const [isOpenCreateRaffleModal, setOpenCreateRaffleModal] = React.useState<boolean>(false);
  const [isOpenCreateAuctionModal, setOpenCreateAuctionModal] = React.useState<boolean>(false);

  const handleOpenCreateRaffleModal = () => {
    setOpenCreateRaffleModal(true);
  }
  const handleCloseCreateRaffleModal = () => {
    setOpenCreateRaffleModal(false);
  }

  const handleOpenCreateAuctionModal = () => {
    setOpenCreateAuctionModal(true);
  }
  const handleCloseCreateAuctionModal = () => {
    setOpenCreateAuctionModal(false);
  }

  const handleSectionChange = (event:any, newValue:string) => {
    setSectionValue(newValue);
  };
  
  const handleRaffleCreated = (raffle: AstraRaffle) => {
  }
  
  const handleAuctionCreated = (auction: AstraAuction) => {
  }

  const handleRaffleUpdated = (raffle: AstraRaffle) => {
  }

  return wallet ? (
    <>
      <HeadElement />
      <ManageRaffle
      isOpen={isOpenCreateRaffleModal}
      isEditing={false}
      raffle={undefined}
      modalClosed={handleCloseCreateRaffleModal}
      raffleSet={ handleRaffleCreated } />
      
      <ManageAuction
      isOpen={isOpenCreateAuctionModal}
      isEditing={false}
      auction={undefined}
      modalClosed={handleCloseCreateAuctionModal}
      auctionSet={ handleAuctionCreated } />

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
              <ThemeProvider theme={tabTheme}>
                <Box className="m-b-md">
                <Tabs value={sectionValue} onChange={handleSectionChange} aria-label="Grim sections" textColor="secondary" indicatorColor="primary">
                  <Tab value="events" label={`Events`} />
                  <Tab value="my_raffles" label={`My Raffles`} />
                  {/*
                  <Tab value="leaderboard" label={`Leaderboard`} />
                  */}
                </Tabs>
                </Box>
              </ThemeProvider>
            </Grid>
          </Grid>
          {canCreateRaffle && (
            <div className="is-flex is-flex-justify-end  m-b-sm">
              <button className="button is-primary" onClick={handleOpenCreateRaffleModal}>Create Raffle</button>
              <button className="button is-primary m-l-sm" onClick={handleOpenCreateAuctionModal}>Create Auction</button>
            </div>
          )}


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