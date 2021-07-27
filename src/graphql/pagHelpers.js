

module.exports = {
    getFilters: ({ filterField, filterValue, filterNestedKey }, additionalFilter) => {
      const match = {};
      if(filterValue){
        let field = filterNestedKey? `${filterField}.${filterNestedKey}` : filterField;
        match[field] = { "$regex" : `/*${filterValue}/*` , "$options" : "i"}
      }
      if(additionalFilter && additionalFilter.key){
        match[additionalFilter.key] = additionalFilter.filter
      }
      return { $match: match }
    },
    getNestedFilters: ({ filterField, filterNestedKey, filterNestedCollection, filterLocalFieldKey }) => {
      if(filterNestedKey && filterNestedCollection && filterLocalFieldKey){
        return {
          $lookup: {
            from: filterNestedCollection,
            localField: filterLocalFieldKey,
            foreignField: '_id',
            as: filterField
          }
        }
      }
    },
    getSorting: ({ sortField, sortOrder, sortNestedKey, filterField }) => {
      let sortBy = {};
      sortBy[`${sortNestedKey? `${sortField}.${sortNestedKey}` : (sortField? sortField : filterField)}`] = (sortOrder? sortOrder : 1);
      return [{ $sort: sortBy }]
    },
    getNestedSorting: ({ sortField, sortNestedKey, sortNestedCollection, sortLocalFieldKey  }) => {
      if(sortNestedKey && sortNestedCollection && sortLocalFieldKey){
        return {
          $lookup: {
            from: sortNestedCollection,
            localField: sortLocalFieldKey,
            foreignField: '_id',
            as: sortField
          }
        }
      }
    },
    customDealsSorting: ({sortField, sortNestedKey, sortOrder}) => {
      if(sortField === 'AUM'){
        return [
          { 
              $lookup:{
                 from: 'investments',
                 localField: '_id',
                 foreignField: 'deal_id',
                 as: 'investments'
               }
           },
           {
               $unwind: '$investments'
           },
           {
               $match: { 'investments.status': { $in: ['complete', 'wired'] }}
           },
           {
               $group: { 
                   _id: '$_id',
                   AUM: { $sum: '$investments.amount' },
                   deal: { '$first': '$$ROOT' }
               }
           },
           {
               $project: { 'deal': 1, 'AUM': 1 }
           },
           { $sort: { 'AUM': (sortOrder ? sortOrder : 1) } }
      ]
      }else if(`${sortField}.${sortNestedKey}`=== 'dealParams.wireDeadline'){
        return [
          { 
              "$addFields": {
                   "closingDate":{
                       $dateFromString: {
                          dateString: '$dealParams.wireDeadline',
                          onError: null
                       }
                   },
              } 
          },
          { $sort: { 'closingDate': (sortOrder ? sortOrder : 1) } }
         ]
      }else if(sortField === 'dealOnboarding'){
        return [
          { 
              $lookup:{
                 from: 'dealOnboarding',
                 localField: 'company_name',
                 foreignField: 'dealName',
                 as: 'dealOnboarding'
               }
           },
           {
               $addFields: {
                   hasProcessStreet: { $cond: { if: { $gte: [ { $size: "$dealOnboarding" }, 1 ]  } , then: true, else: false } }
                   
               }
           },
           { $sort: { 'hasProcessStreet': (sortOrder ? sortOrder : 1) } }
          ]
      }
      return null;
    },
    customUsersSorting: ({ sortField, sortOrder }) => {
      if(['investmentAmount', 'investments'].includes(sortField)){
        return [
          { 
              $lookup:{
                 from: 'investments',
                 localField: '_id',
                 foreignField: 'user_id',
                 as: 'investments'
               }
           },
           {
               $unwind: '$investments'
           },
           {
               $group: { 
                   _id: '$_id',
                   investmentAmount: { $sum: '$investments.amount' },
                    investments: { $sum: 1 },
                   user: { '$first': '$$ROOT' }
               }
           },
           {
               $project: { 'user': 1, 'investmentAmount': 1, investments: 1 }
           },
           { $sort: { [sortField]: (sortOrder ? sortOrder : 1) } },
        ]
      }
      return null;
    }
  }