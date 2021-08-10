const pagHelpers = {
  getFilters: (
    { filterField, filterValue, filterNestedKey },
    additionalFilter
  ) => {
    const match = {};
    if (filterValue) {
      let field = filterNestedKey
        ? `${filterField}.${filterNestedKey}`
        : filterField;
      match[field] = { $regex: `/*${filterValue}/*`, $options: "i" };
    }
    if (additionalFilter && additionalFilter.key) {
      match[additionalFilter.key] = additionalFilter.filter;
    }
    return { $match: match };
  },
  getNestedFilters: ({
    filterField,
    filterNestedKey,
    filterNestedCollection,
    filterLocalFieldKey,
  }) => {
    if (filterNestedKey && filterNestedCollection && filterLocalFieldKey) {
      return {
        $lookup: {
          from: filterNestedCollection,
          localField: filterLocalFieldKey,
          foreignField: "_id",
          as: filterField,
        },
      };
    }
  },
  getSorting: ({ sortField, sortOrder, sortNestedKey, filterField }) => {
    let sortBy = {};
    sortBy[
      `${
        sortNestedKey
          ? `${sortField}.${sortNestedKey}`
          : sortField
          ? sortField
          : filterField
      }`
    ] = sortOrder ? sortOrder : 1;
    return [{ $sort: sortBy }];
  },
  getNestedSorting: ({
    sortField,
    sortNestedKey,
    sortNestedCollection,
    sortLocalFieldKey,
  }) => {
    if (sortNestedKey && sortNestedCollection && sortLocalFieldKey) {
      return {
        $lookup: {
          from: sortNestedCollection,
          localField: sortLocalFieldKey,
          foreignField: "_id",
          as: sortField,
        },
      };
    }
  },
  getDefaultPagAggregation: (
    paginationProps,
    customSortingMethod,
    additionalFilter
  ) => {
    const filter = pagHelpers.getFilters(paginationProps, additionalFilter);
    const nestedFilters = pagHelpers.getNestedFilters(paginationProps);
    let sorting = pagHelpers.getSorting(paginationProps);
    const nestedSorting = pagHelpers.getNestedSorting(paginationProps);

    if (customSortingMethod) {
      const customSorting = pagHelpers[customSortingMethod](paginationProps);
      if (customSorting) sorting = customSorting;
    }

    const aggregation = [
      nestedSorting,
      nestedFilters,
      filter,
      ...sorting,
    ].filter((x) => x && Object.keys(x).length);
    return aggregation;
  },
  customOrgPagination: ({ sortField, sortOrder, ...pagProps }) => {
    const orgFilters = pagHelpers.getFilters(pagProps);
    const aggregation = [
      orgFilters,
      {
        $lookup: {
          from: "deals",
          localField: "_id",
          foreignField: "organization",
          as: "deals",
        },
      },
      { $unwind: "$deals" },
      {
        $facet: {
          totalAUM: [
            {
              $lookup: {
                from: "investments",
                localField: "deals._id",
                foreignField: "deal_id",
                as: "investments",
              },
            },
            {
              $unwind: "$investments",
            },
            {
              $match: { "investments.status": { $in: ["complete", "wired"] } },
            },
            {
              $group: {
                _id: "$_id",
                totalAUM: { $sum: "$investments.amount" },
                slug: { $first: "$slug" },
                name: { $first: "$name" },
              },
            },
          ],
          totalFundAUM: [
            {
              $lookup: {
                from: "investments",
                localField: "deals._id",
                foreignField: "deal_id",
                as: "investments",
              },
            },
            {
              $unwind: "$investments",
            },
            {
              $match: {
                "deals.investmentType": "fund",
                "investments.status": { $in: ["complete", "wired"] },
              },
            },
            {
              $group: {
                _id: "$_id",
                totalFundAUM: { $sum: "$investments.amount" },
                slug: { $first: "$slug" },
                name: { $first: "$name" },
              },
            },
          ],
          totalSPVAUM: [
            {
              $lookup: {
                from: "investments",
                localField: "deals._id",
                foreignField: "deal_id",
                as: "investments",
              },
            },
            {
              $unwind: "$investments",
            },
            {
              $match: {
                "deals.investmentType": { $ne: "fund" },
                "investments.status": { $in: ["complete", "wired"] },
              },
            },
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                slug: { $first: "$slug" },
                totalSPVAUM: { $sum: "$investments.amount" },
              },
            },
          ],
          totalPrivateFunds: [
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                slug: { $first: "$slug" },
                totalPrivateFunds: { $sum: 1 },
              },
            },
          ],
          totalSPVs: [
            {
              $match: { "deals.investmentType": { $ne: "fund" } },
            },
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                slug: { $first: "$slug" },
                totalSPVs: { $sum: 1 },
              },
            },
          ],
          totalFunds: [
            {
              $match: { "deals.investmentType": "fund" },
            },
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                slug: { $first: "$slug" },
                totalFunds: { $sum: 1 },
              },
            },
          ],
          totalInvestors: [
            {
              $lookup: {
                from: "investments",
                localField: "deals._id",
                foreignField: "deal_id",
                as: "investments",
              },
            },
            { $unwind: "$investments" },
            {
              $match: {
                "investments.status": { $in: ["signed", "complete", "wired"] },
              },
            },
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                orgInvestments: { $push: "$investments.user_id" },
              },
            },
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                slug: { $first: "$slug" },
                totalInvestors: {
                  $sum: { $size: { $setUnion: [[], "$orgInvestments"] } },
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          all: {
            $concatArrays: [
              "$totalFundAUM",
              "$totalAUM",
              "$totalSPVAUM",
              "$totalPrivateFunds",
              "$totalSPVs",
              "$totalFunds",
              "$totalInvestors",
            ],
          },
        },
      },
      {
        $unwind: "$all",
      },
      {
        $group: {
          _id: "$all._id",
          totalAUM: { $push: "$all.totalAUM" },
          totalFundAUM: { $push: "$all.totalFundAUM" },
          totalSPVAUM: { $push: "$all.totalSPVAUM" },
          totalPrivateFunds: { $push: "$all.totalPrivateFunds" },
          totalSPVs: { $push: "$all.totalSPVs" },
          totalFunds: { $push: "$all.totalFunds" },
          totalInvestors: { $push: "$all.totalInvestors" },
          name: { $first: "$all.name" },
          slug: { $first: "$all.slug" },
        },
      },
      { $unwind: { path: "$totalAUM", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$totalFundAUM", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$totalSPVAUM", preserveNullAndEmptyArrays: true } },
      {
        $unwind: {
          path: "$totalPrivateFunds",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $unwind: { path: "$totalSPVs", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$totalFunds", preserveNullAndEmptyArrays: true } },
      {
        $unwind: { path: "$totalInvestors", preserveNullAndEmptyArrays: true },
      },

      { $sort: { [sortField]: sortOrder ? sortOrder : 1 } },
    ];

    return aggregation;
  },
  customDealPagination: (
    { sortField, sortOrder, ...pagProps },
    additionalFilter
  ) => {
    const dealFilters = pagHelpers.getFilters(pagProps, additionalFilter);
    if (sortField === "wireDeadline") sortField = "dealParams.wireDeadlineTS";
    if (sortField === "dealMultiple")
      sortField = "dealParams.dealMultipleToDouble";
    const aggregation = [
      dealFilters,
      {
        $facet: {
          AUM: [
            {
              $lookup: {
                from: "investments",
                localField: "_id",
                foreignField: "deal_id",
                as: "investments",
              },
            },
            {
              $unwind: "$investments",
            },
            {
              $match: {
                "investments.status": {
                  $in: ["complete", "wired"],
                },
              },
            },
            {
              $group: {
                _id: "$_id",
                AUM: {
                  $sum: "$investments.amount",
                },
              },
            },
          ],
          deal: [
            {
              $lookup: {
                from: "dealOnboarding",
                localField: "company_name",
                foreignField: "dealName",
                as: "dealOnboarding",
              },
            },
            {
              $addFields: {
                hasProcessStreet: {
                  $cond: {
                    if: {
                      $gte: [
                        {
                          $size: "$dealOnboarding",
                        },
                        1,
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
                "dealParams.wireDeadlineTS": {
                  $dateFromString: {
                    dateString: "$dealParams.wireDeadline",
                    onError: null,
                  },
                },
                "dealParams.dealMultipleToDouble": {
                  $convert: {
                    input: "$dealParams.dealMultiple",
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
            {
              $group: {
                _id: "$_id",
                deal: {
                  $first: "$$ROOT",
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          all: {
            $concatArrays: ["$AUM", "$deal"],
          },
        },
      },
      {
        $unwind: "$all",
      },
      {
        $group: {
          _id: "$all._id",
          AUM: {
            $push: "$all.AUM",
          },
          deal: {
            $push: "$all.deal",
          },
        },
      },
      { $unwind: { path: "$AUM", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$deal", preserveNullAndEmptyArrays: true } },
      { $addFields: { "deal.AUM": "$AUM" } },
      { $sort: { [`deal.${sortField}`]: sortOrder ? sortOrder : 1 } },
    ];

    return aggregation;
  },
  customUserPagination: ({ sortField, sortOrder, ...pagProps }) => {
    const userFilters = pagHelpers.getFilters(pagProps);
    return [
      userFilters,
      {
        $lookup: {
          from: "investments",
          localField: "_id",
          foreignField: "user_id",
          as: "investments",
        },
      },
      {
        $unwind: { path: "$investments", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$_id",
          investmentAmount: { $sum: "$investments.amount" },
          investments: { $sum: 1 },
          user: { $first: "$$ROOT" },
        },
      },
      {
        $addFields: {
          "user.investmentAmount": "$investmentAmount",
          "user.investments": "$investments",
        },
      },
      {
        $project: { user: 1 },
      },
      { $sort: { [`user.${sortField}`]: sortOrder ? sortOrder : 1 } },
    ];
  },
};

module.exports = pagHelpers;
