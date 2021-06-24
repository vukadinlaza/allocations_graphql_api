

module.exports = {
    getPagAggregation: ({ pagination, currentPage, filterField, filterValue, filterNestedKey, filterNestedCollection, filterLocalFieldKey, sortField, sortOrder, sortNestedKey, sortNestedCollection, sortLocalFieldKey }) => {

      const match = {};
      if(filterValue){
        let field = filterNestedKey? `${filterField}.${filterNestedKey}` : filterField;
        match[field] = { "$regex" : `/*${filterValue}/*` , "$options" : "i"}
      }
      let sortBy = {};
      sortBy[`${sortNestedKey? `${sortField}.${sortNestedKey}` : (sortField? sortField : filterField)}`] = (sortOrder? sortOrder : 1)

      let aggregation = []
      if(sortNestedKey && sortNestedCollection && sortLocalFieldKey) aggregation.push({
        $lookup: {
          from: sortNestedCollection,
          localField: sortLocalFieldKey,
          foreignField: '_id',
          as: sortField
        }
      })
      if(filterNestedKey && filterNestedCollection && filterLocalFieldKey) aggregation.push({
        $lookup: {
          from: filterNestedCollection,
          localField: filterLocalFieldKey,
          foreignField: '_id',
          as: filterField
        }
      })

      aggregation.push({$match: match})
      if(sortField && sortOrder) aggregation.push({$sort: sortBy})

      return aggregation
    }
}
