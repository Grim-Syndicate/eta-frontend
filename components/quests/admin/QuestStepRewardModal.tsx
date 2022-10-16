import { Box, Button, Grid, MenuItem, Modal, Select, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import React, { memo, useEffect, useState } from 'react';
import axios from "axios";
import { Handle, Position } from 'react-flow-renderer';


interface Props {
    open: boolean;
    onClose: () => void;
    onSelectReward: (rangeMin: number, rangeMax: number, chance: number, type: string) => void;
}

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 800,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    px: 8
};

const QuestStepRewardModal = (props: Props) => {

    const [rangeMin, setRangeMin] = useState<number>(1);
    const [rangeMax, setRangeMax] = useState<number>(1);
    const [chance, setChance] = useState<number>(100);
    const [type, setType] = useState<string>("ASTRA");

    return (
        <Modal
            open={props.open}
            onClose={() => props.onClose()}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={modalStyle}>
                <h1 className="m-b-lg">Select Reward</h1>
                <Grid columns={24} container spacing={3}>

                    <div className="m-t-sm">Range Min</div>
                    <input style={{ width: "100%" }} value={rangeMin} onChange={e => setRangeMin(e.target.valueAsNumber)} type="number" min={1} max={1000} />

                    <div className="m-t-sm">Range Max</div>
                    <input style={{ width: "100%" }} value={rangeMax} onChange={e => setRangeMax(e.target.valueAsNumber)} type="number" min={1} max={1000} />

                    <div className="m-t-sm">Chance</div>
                    <input style={{ width: "100%" }} value={chance} onChange={e => setChance(e.target.valueAsNumber)} type="number" min={1} max={1000} />

                    <div className="m-t-sm">Type</div>
                    <select style={{ width: "100%" }} value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="ASTRA">ASTRA</option>
                        <option value="OTHER">Other</option>
                    </select>

                    <div className="has-text-centered m-t-sm p-t-sm">
                        <button className="button is-tertiary is-fullwidth" onClick={() => props.onSelectReward(rangeMin, rangeMax, chance, type)}>Confirm</button>
                    </div>
                </Grid>
            </Box>
        </Modal>
    );
};


export default memo(QuestStepRewardModal);