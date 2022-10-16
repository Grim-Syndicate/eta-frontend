import { Box, Button, Grid, MenuItem, Modal, Select, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import React, { memo, useEffect, useState } from 'react';
import axios from "axios";
import { Handle, Position } from 'react-flow-renderer';


interface Props {
    open: boolean;
    onClose: () => void;
    onSelectItem: (item: any) => void;
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

const ItemSelectorModal = (props: Props) => {

    const [items, setItems] = useState<Array<any>>([]);
    const [rangeMin, setRangeMin] = useState<number>(1);
    const [rangeMax, setRangeMax] = useState<number>(1);
    const [chance, setChance] = useState<number>(100);

	useEffect(() => {
		const url = `${domainURL}/admin/item/all`

		axios.post(url, {}).then(response => {
			console.log("response", response);
			setItems(response.data.items);
		});

	}, []);
    
    return (
        <Modal
            open={props.open}
            onClose={() => props.onClose()}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={modalStyle}>
                <h1 className="m-b-lg">Select an Item</h1>
                <Grid columns={24} container spacing={3}>
                    {items &&
                        items.length > 0 &&
                        items.map((item: any) => {
                            return (
                                <Grid item xs={24} md={4} key={item._id} className="quest-card-container m-b-md">
                                    <div className="quest-card">
                                        <div className="has-text-centered">
                                            <img className="quest-card-image" src={item.image} />
                                        </div>
                                        <div className="p-sm">
                                            <div className="m-b-sm" style={{ fontFamily: "bolder", height: "40px" }}>{item.name}</div>  

                                            <div className="m-t-sm">Range Min</div>
                                            <input style={{width: "100%"}} value={rangeMin} onChange={e => setRangeMin(e.target.valueAsNumber)} type="number" min={1} max={1000}/>
                                            
                                            <div className="m-t-sm">Range Max</div>
                                            <input style={{width: "100%"}} value={rangeMax} onChange={e => setRangeMax(e.target.valueAsNumber)} type="number" min={1} max={1000}/>

                                            <div className="m-t-sm">Chance</div>
                                            <input style={{width: "100%"}} value={chance} onChange={e => setChance(e.target.valueAsNumber)} type="number" min={1} max={1000}/>

                                            <div className="has-text-centered m-t-sm p-t-sm">
                                                <button className="button is-tertiary is-fullwidth" onClick={() => props.onSelectItem({itemId: item._id, image: item.image, name: item.name, chance, rangeMin, rangeMax})}>Select Item</button>
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


export default memo(ItemSelectorModal);