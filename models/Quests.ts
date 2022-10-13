

export type QuestScriptType = "USER_CHOICE" | "AUTO_PROGRESS" | "END_QUEST";

export class Quest {
    _id: any;
    title!: string;
    questScript!: Array<QuestStep>;
}

export class QuestStep {
    id!: string;
    name!: string;


    actor!: string;
    line!: string;
    action!: string;
    duration!: number;

    
    //the auto_progress options, not renaming this as it'll break existing quests. Maybe soon.
    options!: Array<QuestStepAutoProgressOption>;
    
    userChoices!: Array<QuestStepUserChoiceOption>;
    
    progressType!: QuestScriptType;

    editor!: {
        position: {
            x: number,
            y: number;
        };
    };

    choiceChosenByUser!: string;
}

export interface QuestStepAutoProgressOption {
    chance: number;
    take: number;
    goToStepId: string;


    //type: QuestScriptType;
}

export interface QuestStepUserChoiceOption {
    text: string;
    goToStepId: string;
}