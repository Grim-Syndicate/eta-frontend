import { Box, Checkbox, CircularProgress, FormControlLabel, FormGroup, styled, Typography } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: '#d63a3a',
    },
}));

interface Props {
    proposalOption: any;
    proposalVoteResult: any;
    supportRequired: number;
    children?: JSX.Element,
}

const ProposalOptionEnded = ({proposalOption, proposalVoteResult, supportRequired, children}: Props) => {
    let proposalInSupport:number = proposalVoteResult.inSupport || 0
    let proposalAgainst:number = proposalVoteResult.against || 0
    let proposalVotes:number = proposalInSupport + proposalAgainst
    let proposalPercentage:number = (proposalInSupport / proposalVotes) * 100
    let proposalPassed = proposalPercentage > supportRequired

    return <Box mb={2}>
    <Box display={'flex'} justifyContent='space-between' >
      <Typography variant="body2">{proposalOption.name}</Typography>
      <Box display={'flex'} alignItems='baseline'  minWidth={100} >
        <Typography variant="body1" sx={{mr:0.5}} >{proposalInSupport} </Typography>
        <Typography variant="caption" color='gray'>/ {proposalVotes}</Typography>
      </Box>
    </Box>
    <Box display={'flex'} alignItems='center' >
      <Checkbox sx={{
      padding: '2px 9px 0 0',
      '&.Mui-checked': {
        color: '#d63a3a',
      },
    }} checked={proposalVoteResult.inSupport} />
          <Box mr={1} flex={1}>
            <BorderLinearProgress variant="determinate" value={proposalPercentage} />
          </Box>
          <Box display={'flex'} alignItems='center' minWidth={100}>
            {proposalPassed && <><CheckCircleOutlineIcon fontSize='small' sx={{ mr: 0.5 }} color='success' /><Typography color={'success.main'} variant='body2' >PASSED</Typography></> }
            {!proposalPassed && <><HighlightOffIcon fontSize='small' sx={{ mr: 0.5 }} color='error' /><Typography color={'error.main'} variant='body2' >FAILED</Typography></> }
          </Box>
    </Box>
    {children}
    </Box>
}

export default ProposalOptionEnded;