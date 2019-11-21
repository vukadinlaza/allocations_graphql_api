export interface IInvestor {
    _id: string;
}

export interface IDeal {
    _id?: string;
    entity_name?: string;
    deal_name?: string;
    company_name?: string;
    company_description?: string;
    investment_documents?: string;
    user_id?: string;
    amount?: string;
    amount_wired?: number;
    total_investors?: number;
    date_closed?: string;
    deal_complete_date?: string;
    operations_agreement?: string;
    subscription_agreement?: string;
    private_placement_memorandum?: string;
    createdAt?: string;
    updatedAt?: string;
    investors?: IInvestor[];
    bank_account?: string;
    formation_certificate_filing?: string;
    ein_filing?: string;
    form_d_filing?: string;
    form_1065_filing?: string;
    w9_filing?: string;
}