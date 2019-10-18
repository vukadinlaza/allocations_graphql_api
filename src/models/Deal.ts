
export interface IInvestor {
    _id: string;
}
export interface IDeal {
    _id: string;
    entity_name: string;
    deal_name: string;
    amount_wired: number;
    total_investors: number;
    deal_complete_date: string;
    investors: IInvestor[];
}

