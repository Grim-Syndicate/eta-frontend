import { Box, Button, Grid, MenuItem, Modal, Select, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import React, { memo, useEffect, useState } from 'react';
import axios from "axios";
import { Handle, Position } from 'react-flow-renderer';


interface Props {
    open: boolean;
    onClose: () => void;
    onSelectQuest: (quest: any) => void;
}

const domainURL = process.env.NEXT_PUBLIC_API_URL || '';
const getQuestsURL = domainURL + "/quests";

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 1200,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const QuestPickerModal = (props: Props) => {

    const [quests, setQuests] = useState([]);

    useEffect(() => {
        loadQuests();
    }, []);

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

    return (
        <Modal
            open={props.open}
            onClose={() => props.onClose()}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={modalStyle}>
                <Grid columns={24} container spacing={3}>
                    {quests &&
                        quests.length > 0 &&
                        quests.map((quest: any) => {
                            return (
                                <Grid item xs={24} md={4} key={quest._id} className="quest-card-container m-b-md">
                                    <div className="quest-card">
                                        <div className="has-text-centered">
                                            <img className="quest-card-image" src={quest.image} />
                                        </div>
                                        <div className="p-sm">
                                            <div className="m-b-sm" style={{ fontFamily: "bolder", height: "40px" }}>{quest.title}</div>
                                            <div style={{ fontSize: "0.6em", height: "70px" }}>{quest.shortDescription}</div>
                                            <div className="has-text-centered m-t-sm p-t-sm">
                                                <button className="button is-tertiary is-fullwidth" onClick={() => props.onSelectQuest(quest)}>Load Quest</button>
                                            </div>
                                        </div>
                                    </div>
                                </Grid>
                            );
                        })}
                </Grid>
            </Box>
        </Modal>
    );
};


export default memo(QuestPickerModal);