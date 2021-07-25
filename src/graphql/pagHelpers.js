

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
    getSorting: ({ sortField, sortOrder, sortNestedKey }) => {
      let sortBy = {};
      sortBy[`${sortNestedKey? `${sortField}.${sortNestedKey}` : (sortField? sortField : filterField)}`] = (sortOrder? sortOrder : 1);
      return { $sort: sortBy }
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
    }
}
