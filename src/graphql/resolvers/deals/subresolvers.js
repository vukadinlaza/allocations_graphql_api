const { CryptoService } = require("@allocations/crypto-service");
const { ObjectId } = require("mongodb");
const Cloudfront = require("../../../cloudfront");
const { requestBuild } = require("../../../utils/build-api");

const Deal = {
  // investment denotes the `ctx.user` investment in this deal (can only be one)
  investment: (deal, _, { user, datasources }) => {
    return datasources.investments.getOneInvestment({
      deal_id: ObjectId(deal._id),
      user_id: ObjectId(user._id),
    });
  },
  investments: (deal, _, { datasources }) => {
    return datasources.investments.getAllInvestments({
      deal_id: ObjectId(deal._id),
    });
  },
  wire_instructions: (deal) => {
    return deal.wireInstructions
      ? Cloudfront.getSignedUrl(deal.wireInstructions)
      : null;
  },
  documents: async (deal) => {
    return deal.documents
      ? deal.documents.map((d) => ({
          link: Cloudfront.getSignedUrl(d),
          path: d.split("/")[2],
        }))
      : null;
  },
  organization: (deal, _, { db }) => {
    return db.organizations.findOne({ _id: ObjectId(deal.organization) });
  },
  approved: async (deal, _, { db }) => {
    const org = await db.organizations.findOne({
      _id: ObjectId(deal.organization),
    });
    return org.approved !== false;
  },
  deal_params: (deal) => {
    let m = 1;
    if (deal.dealParams && deal.dealParams !== null) {
      m = parseFloat(deal.dealParams.dealMultiple || "1");
      deal.dealParams.dealMultiple = m;
    }
    return deal.dealParams || {};
  },
  app_link: async (deal, _, { db }) => {
    const res = await db.organizations.findOne({
      _id: ObjectId(deal.organization),
    });
    const { slug } = res;
    return slug && slug !== "allocations"
      ? `/deals/${slug}/${deal.slug}`
      : `/deals/${deal.slug}`;
  },
  public_link: async (deal, _, { db }) => {
    const { slug } = await db.organizations.findOne({
      _id: ObjectId(deal.organization),
    });
    return `/public/${slug}/deals/${deal.slug}?invite_code=${deal.inviteKey}`;
  },
  raised: async (deal, _, { db }) => {
    const investments = await db.investments
      .find({ deal_id: deal._id })
      .toArray();
    const amount = investments.reduce((acc, inv) => {
      const amount = Number.isInteger(inv.amount) ? inv.amount : 0;
      return acc + amount;
    }, 0);
    return amount;
  },
  viewed_users: async (deal, _, { db }) => {
    return db.users.find({ _id: { $in: deal.usersViewed || [] } }).toArray();
  },
  deal_onboarding: async (deal, _, { db }) => {
    const dealOnboarding = await db.dealOnboarding.findOne({
      dealName: deal.company_name,
    });

    return dealOnboarding;
  },
  AUM: async (deal, _, { db }) => {
    if (deal.AUM) return deal.AUM;
    const wiredInvestments = await db.investments
      .find({ deal_id: deal._id, status: { $in: ["wired", "complete"] } })
      .toArray();
    const aum = wiredInvestments.length
      ? wiredInvestments
          .map((inv) =>
            inv.capitalWiredAmount ? inv.capitalWiredAmount : inv.amount ?? 0
          )
          .reduce((acc, n) => Number(acc) + Number(n))
      : 0;
    return aum;
  },
  metadata: async (deal) => {
    return deal;
  },
  crypto_wallet_address: async (_, { deal_id }) => {
    const res = await CryptoService.getWallet(deal_id);
    if (res.acknowledged) {
      return res.wallet.deposit_address;
    }
    throw new Error(res.error);
  },
  version: async (deal, _, { db }) => {
    // const v2Deal = Promise.resolve();
    const serviceDeal = requestBuild(`/api/v1/deals/${deal._id}`);
    const legacyDeal = db.deals.findOne({ _id: ObjectId(deal._id) });

    return Promise.all([serviceDeal, legacyDeal]).then((values) => {
      // if (values[0]) return "v2-deal";
      if (values[0]) return "service-deal";
      if (values[1]) return "legacy-deal";
      return "no deal found";
    });
  },

  //TO BE DELETED
  wireInstructions: (deal) => {
    return deal.wireInstructions
      ? Cloudfront.getSignedUrl(deal.wireInstructions)
      : null;
  },
  dealParams: (deal) => {
    let m = 1;
    if (deal.dealParams && deal.dealParams !== null) {
      m = parseFloat(deal.dealParams.dealMultiple || "1");
      deal.dealParams.dealMultiple = m;
    }
    return deal.dealParams || {};
  },
  appLink: async (deal, _, { db }) => {
    const res = await db.organizations.findOne({
      _id: ObjectId(deal.organization),
    });
    const { slug } = res;
    return slug && slug !== "allocations"
      ? `/deals/${slug}/${deal.slug}`
      : `/deals/${deal.slug}`;
  },
  publicLink: async (deal, _, { db }) => {
    const { slug } = await db.organizations.findOne({
      _id: ObjectId(deal.organization),
    });
    return `/public/${slug}/deals/${deal.slug}?invite_code=${deal.inviteKey}`;
  },
  viewedUsers: async (deal, _, { db }) => {
    return db.users.find({ _id: { $in: deal.usersViewed || [] } }).toArray();
  },
  dealOnboarding: async (deal, _, { db }) => {
    const dealOnboarding = await db.dealOnboarding.findOne({
      dealName: deal.company_name,
    });

    return dealOnboarding;
  },
};

module.exports = {
  Deal,
};
