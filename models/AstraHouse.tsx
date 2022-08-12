export class AstraRaffle {
    _id: string = "";
    author: string = "";
    authorLink: string = "";
    description: string = "";
    enabled?: boolean;
    enabledFrom?: number = 1656953325000;
    enabledTo: number = 1688489325000;
    image: string = "";
    maxTickets: number = 0;
    numberOfWinners: number = 0;
    ticketPrice: number = 0;
    title: string = "";
    totalTickets: number = 0;
    winnerCount: number = 0;
    uniqueWinners: boolean = false;

    //How many tickets the user currently has
    walletTickets: number = 0;

    winners: Array<string> = [];
    type: string = "RAFFLE";

}

export class AstraAuction {
    _id: string = "";
    author: string = "";
    authorLink: string = "";
    description: string = "";
    enabled: boolean = false;
    enabledFrom: number = 0;
    enabledTo: number = 0;
    image: string = "";
    title: string = "";

    currentBid: number = 0;
    startingBid: number = 0;
    tickSize: number = 0;

    currentWinningWallet: string = "";

    
    type: string = "AUCTION";

}


export interface AstraEvent {
    type: "AUCTION" | "RAFFLE";
    event: AstraRaffle | AstraAuction;
}