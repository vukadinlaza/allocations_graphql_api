### Example GraphQL query


```

query GetAllDeals{
  GetDeals{
    _id,
    entity_name,
    
  }
}

query	 GetDealById{
  GetDealById(id:""){
    _id
    deal_name
    deal_name
    amount_wired
  }
}

query GetAllInvestors{
  GetInvestors{
    _id,
    first_name,
    last_name,
    email,
    accredited_type
  }
}

query GetInvestorById{
  GetInvestorById(id:""){
    _id
    first_name
    last_name
    residence
    accredited_type
    entity_name
  }
}

```