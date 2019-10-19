### Example GraphQL query


```

query GetAllDeals {
  GetDeals {
    _id
    entity_name
    deal_name
    amount_wired
    deal_complete_date
  }
}

query GetDealById {
  GetDealById(id: "5daa58481c9d440000aa9b7a") {
    _id
    deal_name
    deal_name
    amount_wired
  }
}

query GetAllInvestors {
  GetInvestors {
    _id
    first_name
    last_name
    email
    accredited_type
  }
}

query GetInvestorById {
  GetInvestorById(id: "5daa58481c9d440000aa9b7a") {
    _id
    first_name
    last_name
    residence
    accredited_type
    entity_name
  }
}

# mutation CreateDeal($deal_input: IDealInputType!) {
#   addDeal(input: $deal_input) {
#    _id
#     entity_name
#     deal_name
#   }
# }
mutation createDeal {
  addDeal(input:{
    entity_name:"Sharding Capital",
    deal_name:"Securitize",
    amount_wired:30000,
    total_investors:7,
    deal_complete_date: "February 2019",
  }){
    _id
    entity_name
    amount_wired
    total_investors
  }
}
# https://graphql.org/graphql-js/mutations-and-input-types/

mutation createInvestor{
  addInvestor(input:{
    first_name: "test ",
    last_name: "test",
    email:"test@gmail.com",
    entity_name:"dkjlf",
    accredited_type:"kjshdf"
    accredidted_status:"adkfh",
    passport:"aksdhfkjah",
    total_invested:77777
  }){
    _id
    first_name
    residence
    accredited_type
    entity_name
    email
  }
}

```