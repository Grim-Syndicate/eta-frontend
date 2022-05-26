import React, { useEffect, useState } from "react";
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import axios from "axios";

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

const getPublicStateURL = domainURL + "/public-state";

let SOL_PRICE = 0;
let FLOOR_PRICE = 0;

let loadPublicStateRefresh: NodeJS.Timeout | undefined = undefined

const PublicSection = React.forwardRef((nftFunctions, ref) => { 
    const [isPublicStateLoaded, setIsPublicStateLoaded] = useState(false);
    const [allStakedGrims, setAllStakedGrims] = useState(0);
    const [lockedValueSOL, setLockedValueSOL] = useState(0);
    const [lockedValueUSD, setLockedValueUSD] = useState(0);

    useEffect(() => {
      async function data() {
        loadPublicState();
      } 
      data();

      return () => {
        if (loadPublicStateRefresh) clearInterval(loadPublicStateRefresh);
        setAllStakedGrims(0);
        setLockedValueSOL(0);
        setLockedValueUSD(0);
      }
    }, []);

    const renderBigNumber = (num:number) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  
    const loadTVL = async (allStakedGrims:number) => {
        let tlv = FLOOR_PRICE * allStakedGrims;
  
        setLockedValueSOL(parseFloat(tlv.toFixed(2)));
        setLockedValueUSD(parseFloat((tlv * SOL_PRICE).toFixed(2)));
    };

    const loadPublicState = async () => {
      clearInterval(loadPublicStateRefresh);

      try {
        let result = await axios.get(getPublicStateURL);
        
        if (result && result.data && result.data.success) {
          setAllStakedGrims(result.data.allStakedTokens);

          SOL_PRICE = parseFloat(result.data.solPrice.USD);
          FLOOR_PRICE = parseFloat(result.data.floorPrice.SOL);

          loadTVL(result.data.allStakedTokens);
        }

        loadPublicStateRefresh = setInterval(() => loadPublicState(), 15 * 60 * 1000);
        setIsPublicStateLoaded(true);
      } catch (err) {
        console.error(err)
      }
    }

    return <Grid container spacing={2} className="m-b-md data-items-wrapper">
      <Grid item xs={24}>
        <div className="box-light p-md has-border-radius-md">
          <Grid container columns={24} className="data-items-wrapper">
            <Grid item xs={24} md={11} className="is-flex-column">
              <div>
                <strong>Global % of clocked in agents</strong>
                <div className="has-font-gooper-bold has-text-primary has-font-size-md">{isPublicStateLoaded ? `${allStakedGrims / 100}%` : <Skeleton width="33%" variant="text" />}</div>
                <div className="has-font-size-sm m-t-sm">{allStakedGrims} / 10,000 Grims are staked</div>
              </div>
            </Grid>
            <Grid item xs={24} md={2} className="is-flex is-flex-justify-center"> 
              <Divider orientation="vertical" flexItem/>
              <hr className="horizontal-divider m-t-lg m-b-lg" />
            </Grid>
            <Grid item xs={24} md={11} className="is-flex-column">
              <div>
                <strong>Total Minimum Value Locked</strong>
                <div className="has-text-primary has-font-gooper-bold has-font-size-md">{isPublicStateLoaded ? `$${renderBigNumber(lockedValueUSD)}` : <Skeleton width="33%" variant="text" />}</div>
                <div className="has-font-size-sm m-t-sm">{isPublicStateLoaded ? `${renderBigNumber(lockedValueSOL)} SOL` : '-'}</div>
                <div className="m-t-md"><small>Real-time data provided by <a href="https://solanafloor.com/nft/grim-syndicate" target="_blank" rel="noreferrer">SolanaFloor</a></small></div>
              </div>
            </Grid>
          </Grid>
        </div>
      </Grid>
    </Grid>
})

export default PublicSection;