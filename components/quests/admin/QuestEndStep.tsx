import { Box, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { memo, useEffect } from 'react';

import { Handle, Position, useUpdateNodeInternals } from 'react-flow-renderer';


interface Props {
	isConnectable: boolean;
	data: any;
	id: string; //nodeId
}
const QuestEndStep = (props: Props) => {

	const data = props.data;
	const isConnectable = props.isConnectable;
	const nodeId = props.id;

	return (
		<div className="react-flow__node-default" style={{ textAlign: "left", width: "100%", height: "100%", background: "black", color: "white" }}>

			{data.isInitialStep && (<div style={{ backgroundColor: "red", color: "white", padding: "10px 20px", borderRadius: "10px", transform: "translateX(-50%)", position: "absolute", left: "10%", top: -30, fontWeight: 900 }}>INTRO STEP</div>)}



			<div style={{ fontWeight: "bold" }}>Quest Ending: {data.name}</div>


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


			<div>
				Name
			</div>
			<input
				className="nodrag"
				type="text"
				onChange={(e) => data.onStepNameChange(e, nodeId)}
				defaultValue={data.name}
			/>


			<div className="m-t-sm m-b-md">
				Script <span onClick={() => data.onClickEditScript(nodeId)}>[Edit]</span>
				<Box sx={{ fontWeight: 'bold' }}>Actor: {data.actor}</Box>
				<div>Line: {data.line.substr(0, 50)}...</div>
				<div>Duration: {data.duration}ms</div>
			</div>






		</div>
	);
};


export default memo(QuestEndStep);