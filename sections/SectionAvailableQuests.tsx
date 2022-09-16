import React, { useEffect, useState } from "react";
import Grid from '@mui/material/Grid';
import axios from "axios";
import { CircularProgress } from "@mui/material";

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';

const getQuestsURL = domainURL + "/quests";

const SectionAvailableQuests = React.forwardRef(() => { 
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    async function data() {
      setIsLoadingQuests(true);
      await loadQuests();
      setIsLoadingQuests(false);
    } 
    data();
  }, [])

  const loadQuests = async () => {
      try {
        let result = await axios.get(getQuestsURL);

        if (result && result.data && result.data.success && result.data.quests) {
          setQuests(result.data.quests);
        }
      } catch (error) {
        console.error('error...', error)
      }
  }

  return <section className="m-t-md m-b-lg">
  <div className="quest-cards">
    { isLoadingQuests && <CircularProgress color="inherit" /> }
    <Grid columns={24} container spacing={3}>
      {quests &&
        quests.length > 0 &&
        quests.map((quest:any) => {
          return (
            <Grid item xs={24} md={8} key={quest._id} className="quest-card-container m-b-md">
              <div className="quest-card">
                <div className="has-text-centered">
                    <img className="quest-card-image" src={quest.image} />
                </div>
                <div className="quest-description">
                  <h2>{quest.title}</h2>
                  <p>{quest.shortDescription}</p>
                  <h4>{quest.planeType}</h4>
                  <h3>{quest.planeValue}</h3>
                  <h4>Possible Rewards</h4>
                  { quest.rewards.map((reward:any) => {
                    return <h3>Up to { reward.rangeMax } { reward.type }</h3>
                  }) }
                  <div className="has-text-centered m-t-sm p-t-sm">
                    <a href={`/field-work/${quest._id}`} className="button is-tertiary is-fullwidth">Start Assignment</a>
                  </div>
                </div>
              </div>
            </Grid>
          );
        })}
    </Grid>
  </div>
</section>

})

export default SectionAvailableQuests;