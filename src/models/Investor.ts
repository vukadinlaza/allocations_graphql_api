export interface IInvestor {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    residence: string;
    accredited_type: string;
    accredidted_status: string;
    entity_name: string;
    investor_type: string;
    passport: string;
    deal_complete_data: string;
    total_invested: number;
    deals_invited: string[];
    kyc_status: string;
    aml_status: string;
    score: number;
}