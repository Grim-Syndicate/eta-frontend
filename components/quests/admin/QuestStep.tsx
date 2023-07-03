import { Box, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { memo, useEffect } from 'react';

import { Handle, Position, useUpdateNodeInternals } from 'react-flow-renderer';


interface Props {
	isConnectable: boolean;
	data: any;
	id: string; //nodeId
}
const QuestStep = (props: Props) => {

	const data = props.data;
	const isConnectable = props.isConnectable;
	const nodeId = props.id;

	const updateNodeInternals = useUpdateNodeInternals();
	useEffect(() => {
		console.log("Step data updated");
		updateNodeInternals(nodeId);

	}, [data]);
	return (
		<div className="node-default" style={{ textAlign: "left", width: "100%", height: "100%", background: "transparent" }}>

			{data.isInitialStep && (<div style={{ backgroundColor: "red", color: "white", padding: "10px 20px", borderRadius: "10px", transform: "translateX(-50%)", position: "absolute", left: "10%", top: -30, fontWeight: 900, fontSize: "0.8em" }}>INTRO STEP</div>)}


			{/*<div style={{ display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid black", backgroundColor: "white", color: "black", padding: "10px 20px", borderRadius: "10px", transform: "translateX(-50%)", position: "absolute", left: "100%", top: -30, fontWeight: 900, fontSize: 10 }}>
				{data.progressType}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style={{marginLeft: "10px", width: "20px", height: "20px"}}>
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
				</svg>

	</div>*/}


			{/*<div style={{ fontWeight: "bold" }}>Quest Step: {data.name}</div>*/}


			<Handle
				id={nodeId + "handle1"}
				type="target"
				position={Position.Top}
				style={{ background: '#555' }}
				onConnect={(params) => console.log('handle onConnect', params)}
				isConnectable={isConnectable}
			/>
			<Handle
				id={nodeId + "handle2"}
				type="target"
				position={Position.Left}
				style={{ background: '#555' }}
				onConnect={(params) => console.log('handle onConnect', params)}
				isConnectable={isConnectable}
			/>
			<Handle
				id={nodeId + "handle3"}
				type="target"
				position={Position.Right}
				style={{ background: '#555' }}
				onConnect={(params) => console.log('handle onConnect', params)}
				isConnectable={isConnectable}
			/>
			<Handle
				id={nodeId + "handle4"}
				type="target"
				position={Position.Bottom}
				style={{ background: '#555' }}
				onConnect={(params) => console.log('handle onConnect', params)}
				isConnectable={isConnectable}
			/>


			{/*
			<div>
				Name
			</div>
			<input
				className="nodrag"
				type="text"
				onChange={(e) => data.onStepNameChange(e, nodeId)}
				defaultValue={data.name}
			/>*/}


			<div className="m-t-sm m-b-md">
				<div>
					<Button size="small" onClick={() => data.onClickEditScript(nodeId)} className='m-b-sm' color='secondary' variant="contained">Edit Script</Button>
				</div>
				<Box sx={{ fontWeight: 'bold' }}>Actor: {data.actor}</Box>
				<div>Line: {data.line.substr(0, 50)}...</div>
				<div>Duration: {data.duration}ms</div>
			</div>



			{/*
			<textarea
				className="nodrag"
				rows={10}
				onChange={(e) => data.onStepScriptChange(e, nodeId)}
				defaultValue={data.script}
			/>*/}

			<div>Progress Type</div>
			<ToggleButtonGroup
				color="primary"
				value={data.progressType}
				exclusive
				onChange={(e) => data.onStepProgressTypeChange(e, nodeId)}
				aria-label="Platform"
			>
				<ToggleButton size="small" value="AUTO_PROGRESS">Random</ToggleButton>
				<ToggleButton size="small" value="USER_CHOICE">User Choice</ToggleButton>
			</ToggleButtonGroup>




		</div>
	);
};


export default memo(QuestStep);