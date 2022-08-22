export class Proposal {
    _id: string = "";
    title: string = "";
    description: string = "";
    author: string = "";
    authorLink: string = "";
    enabled?: boolean;
    enabledFrom?: number = 1656953325000;
    enabledTo: number = 1688489325000;
    quorumRequired: number = 0;
    supportRequired: number = 0;
    options: Array<ProposalOption> = [];
    votes: Array<ProposalVote> = [];
}

type ProposalOption = {
    _id: string
    name: string
    subOptions?: Array<ProposalOption>
};

export type ProposalVote = {
    proposalOptionID: string
    name: string
    subOptions?: Array<ProposalVote>
    wallet?: string
    token?: string
    inSupport: boolean
};