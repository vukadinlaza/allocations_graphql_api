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
          slackProspects: [
            {
              $addFields: {
                isSlackDeal: {
                  $cond: [{ $eq: ["$deals.slack_deal", true] }, 1, 0],
                },
              },
            },
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                slug: { $first: "$slug" },
                slackDeals: { $sum: "$isSlackDeal" },
              },
            },
          ],
          totalClosed: [
            { $match: { "deals.date_closed": { $exists: true, $ne: "" } } },
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                slug: { $first: "$slug" },
                totalClosed: { $sum: 1 },
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
              "$slackProspects",
              "$totalClosed",
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
          slackProspects: { $push: "$all.slackDeals" },
          totalClosed: { $push: "$all.totalClosed" },
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
      {
        $unwind: { path: "$slackProspects", preserveNullAndEmptyArrays: true },
      },
      { $unwind: { path: "$totalClosed", preserveNullAndEmptyArrays: true } },

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
  customUserPagination: (
    { sortField, sortOrder, ...pagProps },
    additionalFilter
  ) => {
    const userFilters = pagHelpers.getFilters(pagProps, additionalFilter);
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
        $lookup: {
          from: "deals",
          localField: "investments.deal_id",
          foreignField: "_id",
          as: "investments.deal",
        },
      },
      {
        $unwind: {
          path: "$investments.deal",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          investmentMultiple: {
            $convert: {
              input: "$investments.deal.dealParams.dealMultiple",
              to: "double",
              onError: 1, // Optional.
              onNull: 1, // Optional.
            },
          },
          investmentIntValue: {
            $convert: {
              input: "$investments.amount",
              to: "int",
              onError: 0, // Optional.
              onNull: 0, // Optional.
            },
          },
        },
      },
      {
        $addFields: {
          investmentNewValue: {
            $multiply: ["$investmentIntValue", "$investmentMultiple"],
          },
          invSlackAmount: {
            $cond: [
              { $eq: ["$investments.deal.slack_deal", true] },
              "$investmentIntValue",
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          investmentAmount: { $sum: "$investmentIntValue" },
          portfolioValue: { $sum: "$investmentNewValue" },
          investments: { $sum: 1 },
          slackAmount: { $sum: "$invSlackAmount" },
          user: { $first: "$$ROOT" },
        },
      },
      {
        $addFields: {
          "user._id": "$_id",
          "user.avgMultiple": {
            $divide: [
              "$portfolioValue",
              {
                $cond: [
                  { $gte: ["$investmentAmount", 1] },
                  "$investmentAmount",
                  1,
                ],
              },
            ],
          },
          "user.investmentAmount": "$investmentAmount",
          "user.investmentsCount": "$investments",
          "user.portfolioValue": "$portfolioValue",
          "user.slackAmount": "$slackAmount",
        },
      },
      {
        $project: {
          "user._id": 1,
          "user.first_name": 1,
          "user.last_name": 1,
          "user.email": 1,
          "user.investmentAmount": 1,
          "user.investmentsCount": 1,
          "user.avgMultiple": 1,
          "user.portfolioValue": 1,
          "user.allocations_angel": 1,
          "user.linkedinUrl": 1,
          "user.sectors": 1,
          "user.slackAmount": 1,
          "user.country": 1,
        },
      },
      { $sort: { [`user.${sortField}`]: sortOrder ? sortOrder : 1 } },
    ];
  },
  customInvestmentPagination: ({ ...paginationProps }) => {
    const filter = pagHelpers.getFilters(paginationProps);
    const nestedFilters = pagHelpers.getNestedFilters(paginationProps);
    let sorting = pagHelpers.getSorting(paginationProps);
    const nestedSorting = pagHelpers.getNestedSorting(paginationProps);
    const amountToNumber = {
      $addFields: {
        amount: {
          $convert: {
            input: "$amount",
            to: "int",
            onError: 0, // Optional.
            onNull: 0, // Optional.
          },
        },
      },
    };
    const aggregation = [
      nestedSorting,
      nestedFilters,
      filter,
      amountToNumber,
      ...sorting,
    ].filter((x) => x && Object.keys(x).length);
    return aggregation;
  },
  customDocumentPagination: (
    { sortField, sortOrder, filterValue, filterField },
    documentType
  ) => {
    let aggregation = [];
    const currentSortField = sortField === "email" ? "userEmail" : sortField;
    const currentFilterField =
      filterField === "email" ? "userEmail" : filterField;
    if (["KYC", "K-12"].includes(documentType)) {
      const regex = documentType === "KYC" ? ["W-8", "W-9"].join("|") : "K-1";
      aggregation = [
        {
          $match: {
            documents: {
              $exists: true,
            },
          },
        },
        {
          $unwind: "$documents",
        },
        {
          $match: {
            "documents.documentName": {
              $regex: regex,
            },
          },
        },
        {
          $addFields: {
            "documents.userEmail": "$email",
            "documents.link": "$documents.docspringPermDownloadLink",
            "documents.source": {
              $cond: {
                if: { $not: ["$documents.signerDocusignId"] },
                then: "DocSpring",
                else: "DocuSign",
              },
            },
          },
        },
        {
          $project: {
            email: 1,
            documents: 1,
          },
        },
        {
          $sort: {
            [`documents.${currentSortField}`]: sortOrder ? sortOrder : 1,
          },
        },
        {
          $match: filterValue
            ? {
                [`documents.${currentFilterField}`]: {
                  $regex: `/*${filterValue}/*`,
                  $options: "i",
                },
              }
            : {},
        },
      ];
    } else {
      aggregation = [
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $match: {
            documents: {
              $exists: true,
            },
          },
        },
        {
          $unwind: "$documents",
        },
        {
          $addFields: {
            "documents.userEmail": "$user.email",
            "documents.documentName": {
              $cond: [
                { $eq: [{ $type: "$documents" }, "string"] },
                { $arrayElemAt: [{ $split: ["$documents", "/"] }, -1] },
                "$documents.documentName",
              ],
            },
            "documents.link": {
              $cond: {
                if: { $not: ["$documents.docspringPermDownloadLink"] },
                then: "$documents",
                else: "$documents.docspringPermDownloadLink",
              },
            },
            "documents.source": {
              $cond: {
                if: { $not: ["$documents.signerDocusignId"] },
                then: "DocSpring",
                else: "DocuSign",
              },
            },
          },
        },
        { $unwind: "$documents.userEmail" },
      ];
    }
    aggregation.push({ $project: { documents: 1 } });
    aggregation.push({
      $sort: { [`documents.${currentSortField}`]: sortOrder ? sortOrder : 1 },
    });
    aggregation.push({
      $match: filterValue
        ? {
            [`documents.${currentFilterField}`]: {
              $regex: `/*${filterValue}/*`,
              $options: "i",
            },
          }
        : {},
    });
    return aggregation;
  },
};

module.exports = pagHelpers;
