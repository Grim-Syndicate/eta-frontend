import { Button } from '@mui/material';
import React, { memo } from 'react';

import { Handle, Position } from 'react-flow-renderer';


interface Props {
	isConnectable: boolean;
	data: any;
	id: string; //nodeId
}
const QuestStep = (props: Props) => {

	const data = props.data;
	const isConnectable = props.isConnectable;
	const nodeId = props.id;


	return (
		<div className="react-flow__node-default" style={{ textAlign: "left", width: "100%", height: "100%", background: "transparent" }}>

			{data.isInitialStep && (<div style={{ backgroundColor: "red", color: "white", padding: "10px 20px", borderRadius: "10px", transform: "translateX(-50%)", position: "absolute", left: "10%", top: -30, fontWeight: 900 }}>INTRO STEP</div>)}


			<div style={{ fontWeight: "bold" }}>Quest Step: {data.name}</div>


			<Handle
				type="target"
				position={Position.Top}
				style={{ background: '#555' }}
				onConnect={(params) => console.log('handle onConnect', params)}
				isConnectable={isConnectable}
			/>
			<div>
				Name
			</div>
			<input
				className="nodrag"
				type="text"
				onChange={(e) => data.onStepNameChange(e, nodeId)}
				defaultValue={data.name}
			/>


			<div className="m-t-sm">
				Script
			</div>
			<textarea
				className="nodrag"
				rows={10}
				onChange={(e) => data.onStepScriptChange(e, nodeId)}
				defaultValue={data.script}
			/>

			<Button onClick={() => data.addChoice(nodeId)} variant="contained" style={{position: "relative"}}>Add Choice</Button>
		</div>
	);
};


export default memo(QuestStep);