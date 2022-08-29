import React, { useContext } from "react";
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import { GrimsContext } from "../components/GrimsProvider";
import Utils from "../utils/Utils";

const PublicSection = React.forwardRef((nftFunctions, ref) => { 
  const { 
    isPublicStateLoaded,
    allStakedGrims,
    lockedValueSOL,
    lockedValueUSD,
  } = useContext(GrimsContext);

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
              <div className="has-text-primary has-font-gooper-bold has-font-size-md">{isPublicStateLoaded ? `$${Utils.renderBigNumber(lockedValueUSD)}` : <Skeleton width="33%" variant="text" />}</div>
              <div className="has-font-size-sm m-t-sm">{isPublicStateLoaded ? `${Utils.renderBigNumber(lockedValueSOL)} SOL` : '-'}</div>
              <div className="m-t-md"><small>Real-time data provided by <a href="https://solanafloor.com/nft/grim-syndicate" target="_blank" rel="noreferrer">SolanaFloor</a></small></div>
            </div>
          </Grid>
        </Grid>
      </div>
    </Grid>
  </Grid>
})

export default PublicSection;