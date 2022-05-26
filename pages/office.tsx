
import React from "react";
import Grid from '@mui/material/Grid';
import Sidebar from '../components/Sidebar';
import Nightshift from "../components/Nightshift";

const Office = React.forwardRef(() => { 
    const departmentsBreakdown = {
      "BASE_COMMON": 1,
      "BASE_RARE": 1.5,
      "BASE_LEGENDARY": 1.75,
      "BASE_MYTHIC": 2,
      "BASE_ANCIENT": 2.5,
      "BASE_GOLDEN_ANCIENT": 3
    }

    return  (
      <div>
        <div className="title-bar p-md main-content-wrapper">
          <div className="container main-content-wrapper">
            <h1 className="has-text-white has-font-tomo has-text-shadow">Office</h1>
            <Nightshift />
          </div>
        </div>
      
        <main className="m-t-md">
          <div className="container main-wrapper">
            <Grid columns={24} container spacing={3} className="main-content-wrapper">
              <Grid item xs={24} sm={24} md={24} lg={18}>
                <div className="box-light p-md has-border-radius-lg">
                  <section className="grim-departments-wrapper">
                    <div className="grim-departments-details">
                      <small>Base salaries</small>
                      <div className="has-font-size-md has-font-gooper-bold has-text-primary m-b-md">Departments</div>
                    </div>

                    <div className="grim-departments-bases">
                      <div className="grim-base-wrapper has-border-base-common has-border-radius-sm p-sm">
                        <div className="grim-base-image-wrapper">
                          <img src="/img/base-common.svg" alt="Common base" title="Common" className="img-fluid" />
                        </div>
                        <div>
                          <small className="is-uppercase">Common • X{departmentsBreakdown["BASE_COMMON"]}</small>
                          <div className="has-font-gooper-bold">10 $ASTRA/day</div>
                        </div>
                      </div>

                      <div className="grim-base-wrapper has-border-base-rare has-border-radius-sm p-sm">
                        <div className="grim-base-image-wrapper">
                          <img src="/img/base-rare.svg" alt="Rare" title="Rare" className="img-fluid" />
                        </div>
                        <div>
                          <small className="is-uppercase">Rare • X{departmentsBreakdown["BASE_RARE"]}</small>
                          <div className="has-font-gooper-bold has-text-base-rare">15 $ASTRA/day</div>
                        </div>
                      </div>

                      <div className="grim-base-wrapper has-border-base-legendary has-border-radius-sm p-sm">
                        <div className="grim-base-image-wrapper">
                          <img src="/img/base-legendary.svg" alt="Legendary base" title="Legendary" className="img-fluid" />
                        </div>
                        <div>
                          <small className="is-uppercase">Legendary • X{departmentsBreakdown["BASE_LEGENDARY"]}</small>
                          <div className="has-font-gooper-bold has-text-base-legendary">17.5 $ASTRA/day</div>
                        </div>
                      </div>

                      <div className="grim-base-wrapper has-border-base-mythic has-border-radius-sm p-sm">
                        <div className="grim-base-image-wrapper">
                          <img src="/img/base-mythic.svg" alt="Mythic base" title="Mythic" className="img-fluid" />
                        </div>
                        <div>
                          <small className="is-uppercase">Mythic • X{departmentsBreakdown["BASE_MYTHIC"]}</small>
                          <div className="has-font-gooper-bold has-text-base-mythic">20 $ASTRA/day</div>
                        </div>
                      </div>

                      <div className="grim-base-wrapper has-border-base-ancient has-border-radius-sm p-sm">
                        <div className="grim-base-image-wrapper">
                          <img src="/img/base-ancient.svg" alt="Ancient base" title="Ancient" className="img-fluid" />
                        </div>
                        <div>
                          <small className="is-uppercase">Ancient • X{departmentsBreakdown["BASE_ANCIENT"]}</small>
                          <div className="has-font-gooper-bold has-text-base-ancient">25 $ASTRA/day</div>
                        </div>
                      </div>

                      <div className="grim-base-wrapper has-border-base-golden-ancient has-border-radius-sm p-sm">
                        <div className="grim-base-image-wrapper">
                          <img src="/img/base-golden-ancient.svg" alt="Golden Ancient base" title="Golden Ancient" className="img-fluid" />
                        </div>
                        <div>
                          <small className="is-uppercase">Golden Ancient • X{departmentsBreakdown["BASE_GOLDEN_ANCIENT"]}</small>
                          <div className="has-font-gooper-bold has-text-base-golden-ancient">30 $ASTRA/day</div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </Grid>
              <Grid item xs={24} sm={24} md={24} lg={6}>
                <Sidebar />
              </Grid>
            </Grid>
          </div>
          <div className="box-eta p-t-xl p-b-xl">
            <div className="container main-wrapper">
              <Grid columns={24} container spacing={6} className="main-content-wrapper">
                <Grid item xs={24} sm={24} md={8} xl={10}>
                  <h1 className="has-font-gooper-bold has-font-size-md has-text-primary">What is the Ethereal Transit Authority?</h1>
                  <p>The Ethereal Transit Authority, or the ETA as we call it around here, is solely responsible for one very specific, but universally critical task: the transportation of recently severed Souls from their native universe to their new eternal home in the Ethereal Plane.</p>
                  <p>The Grims that work at the ETA are the Reaper Agents of the Infinitum that are paid in $ASTRA, the currency of the Knownverse. So go get those Grims to work and we'll see ya around!</p>
                  <a className="button is-primary is-outlined m-t-lg" href="https://www.notion.so/grim-syndicate/ASTRA-and-Staking-FAQs-44225267d5c14862a6e8b111d96ab124" target="_blank" rel="noreferrer">Read staking documentation</a>
                </Grid>
                <Grid item xs={24} sm={24} md={16} xl={14}>
                  <img src="/img/office.png" alt="ETA office" className="img-fluid is-fullwidth" />
                </Grid>
              </Grid>
            </div>
          </div>
        </main>
      </div>
    );
});

export default Office;