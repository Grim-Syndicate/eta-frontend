import React from "react";
import Grid from '@mui/material/Grid';

const Sidebar = React.forwardRef((nftFunctions, ref) => { 
    return <div className="sidebar m-b-md">
      <div className="box-light p-md has-border-radius-md">
        <Grid columns={24} container rowSpacing={2} spacing={4}>
          <Grid item xs={14} sm={8} md={6} lg={14}>
            <img src="https://hkgwtdvfyh.medianetwork.cloud/unsafe/600x600/filters:format(webp)/https://www.arweave.net/XsU_DGOhJuvLTJuWkPSxBKz1QgHPm6N1Lhq3AcGE0AY?ext=png" alt="Grim of the Month" className="img-fluid has-border-radius-round" />
          </Grid>
          <Grid item xs={24} sm={16} md={18} lg={24}>
            <div>April</div>
            <div className="has-font-gooper-bold has-text-primary has-font-size-md m-t-sm m-b-sm">Grim of the Month</div>
            <p><strong><a href="https://twitter.com/rulleSOL" target="_blank" rel="noreferrer">@rulleSOL</a></strong>. Masterful ETA recruit mentor, feet connoisseur and simian aficionado. The Ethereal Transit Authority and Nazuul himself commend your work ethic!</p>
          </Grid>
        </Grid>
      </div>
    </div>
})

export default Sidebar;