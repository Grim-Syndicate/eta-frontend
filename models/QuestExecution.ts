class QuestExecution {
    _id: any
    walletID: any
    questID: any
    participants: any
    status!: string
    cancelStatus: any
    revertStatus: any
    timestamp!: number
    finishTimestamp!: number
    stamina: any
    rewards: any
    pendingRewards: any
    claimableRewards: any
    pendingClaims: any

    get progress() {
        if(this.status == 'COMPLETE' || this.status == 'CLAIMED' ){
            return 1
        }
        let questLength = this.finishTimestamp - this.timestamp
        let now = Date.now()
        let questActiveFor = now - this.timestamp
        let progress = (questActiveFor / questLength)
        return progress >= 1 ? 1 : progress
    }

    get progressDone() {
        return this.progress >= 1 ? true : false
    }
}

export default QuestExecution 