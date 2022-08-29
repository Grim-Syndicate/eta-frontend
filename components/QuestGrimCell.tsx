import React from 'react'
import Grid from '@mui/material/Grid';

const QuestGrimCell = ({ metadata, selected = false, onClick = null, quest = null, isStoryFinished = false }:{
    metadata:any,
    selected:boolean,
    onClick:any,
    quest?:any,
    isStoryFinished?:boolean
}) => {
    const renderTitle = function () {
        if(quest != null){
            let status = 'Active'
            let className = '';

            switch(quest.status){
                case 'STARTED':
                    if(isStoryFinished){
                        status = 'Waiting'
                        className = 'waiting'
                    } else {
                        status = 'Active'
                    }
                    break
                case 'COMPLETE':
                    status = 'Done'
                    className = 'done'
            }
            return <p className={className}>{status}</p>
        }
        return <p>{`${ selected ? 'Ready' : 'Agent'}`}</p>
    }

    const renderSubtitle = function () {
        if(quest != null){
            return <></>
        }
        return <h4>#{metadata.ID}</h4>
    }

    return (
        <Grid item xs={8} className="grim-card-container m-b-md">
        <div className={`grim-card ${ selected ? 'selected' : ''}`} onClick={onClick}>
            <div className="grim-card-image-container">
              <img className="grim-card-image" src={metadata.image} alt={metadata.name} />
            </div>
            { renderTitle() }
            { renderSubtitle() }
        </div>
        </Grid>
    )
}

export default QuestGrimCell