

module.exports = {
    getOrgOverviewData: (slug) => {
      return (
        [
            {
              "$lookup": {
                "from": "organizations",
                "localField": "organization",
                "foreignField": "_id",
                "as": "organization"
              }
            },
            {
              "$match": {
                "organization.slug": slug
              }
            },
            {
              "$facet": {
                "funds": [
                  {
                    "$match": {
                      "investmentType": "fund"
                    }
                  },
                  {
                    "$count": "count"
                  }
                ],
                "SPVs": [
                  {
                    "$match": {
                      "investmentType": {
                        "$ne": "fund"
                      }
                    }
                  },
                  {
                    "$count": "count"
                  }
                ],
                "AUM": [
                  {
                    "$lookup": {
                      "from": "investments",
                      "localField": "_id",
                      "foreignField": "deal_id",
                      "as": "investments"
                    }
                  },
                  {
                    "$unwind": "$investments"
                  },
                  {
                    "$match": {
                      "investments.status": {
                        "$in": [
                          "complete",
                          "wired"
                        ]
                      }
                    }
                  },
                  {
                    "$group": {
                      "_id": "",
                      "total": {
                        "$sum": "$investments.amount"
                      }
                    }
                  }
                ],
                "investors": [
                  {
                    "$lookup": {
                      "from": "investments",
                      "localField": "_id",
                      "foreignField": "deal_id",
                      "as": "investments"
                    }
                  },
                  {
                    "$unwind": "$investments"
                  },
                  {
                    "$match": {
                      "investments.status": {
                        "$in": [
                          "complete",
                          "wired"
                        ]
                      }
                    }
                  },
                  {
                    "$group": {
                      "_id": "$investments.user_id"
                    }
                  },
                  {
                    "$count": "count"
                  }
                ]
              }
            },
            {
              "$unwind": {
                  "path": "$funds",
                  "preserveNullAndEmptyArrays": true
                  }
            },
              {
              "$unwind": {
                  "path": "$SPVs",
                  "preserveNullAndEmptyArrays": true
                  }
            },
              {
              "$unwind": {
                  "path": "$investors",
                  "preserveNullAndEmptyArrays": true
                  }
            },
              {
              "$unwind": {
                  "path": "$AUM",
                  "preserveNullAndEmptyArrays": true
                  }
            },
            {
              "$addFields": {
                "funds": "$funds.count",
                "SPVs": "$SPVs.count",
                "investors": "$investors.count",
                "AUM": "$AUM.total"
              }
            }
          ]
      )
    }
  }