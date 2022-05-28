import React from 'react'
import Grid from '@mui/material/Grid';
import Utils from '../utils/Utils';

const QuestGrimInfo = ({ grimOnQuest, isStoryFinished } : { grimOnQuest:any, isStoryFinished:boolean}) => {
    const calculateProgress = function () {
        if(grimOnQuest == null) return -1
        return isStoryFinished ? 1 : 0
    }

    const renderProgress = function () {
        if(calculateProgress() == -1) {
            return '-'
        }
        return Utils.renderPercentage(calculateProgress() * 100)
    }

    const renderStatus = function () {
        if(grimOnQuest?.quest != null){
            let status = 'Active'

            switch(grimOnQuest.quest.status){
                case 'STARTED':
                    if(calculateProgress() >= 1){
                        status = 'Waiting'
                    } else {
                        status = 'Active'
                    }
                    break
                case 'COMPLETE':
                    status = 'Done'
            }
            return status
        }

        return '-'
    }

    return (
        <Grid item className={`grim-quest-info ${grimOnQuest == null ? '' : 'open'} ${renderStatus().toLowerCase()}`}>
        <div className="header">
          <div className="left">
            <h4>Agent</h4>
            <p>#{ grimOnQuest?.grim.metadata.ID }</p>
          </div>
          <div className="right">
            <span className="status">{ renderStatus() }</span> 
          </div>
        </div>
        {/*<div className="progress">
          <div className="header">
            <div className="left">
                <h4>Progress</h4>
            </div>
            <div className="right">
              <p>{renderProgress()}</p> 
            </div>
          </div>
          <div className="quest-progress-wrapper"><div className="quest-progress"><div style={{width: renderProgress()}}></div></div></div>
        </div>
        */}
      </Grid>
    )
}

export default QuestGrimInfo