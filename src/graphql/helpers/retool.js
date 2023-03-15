const apiUrls = {
  EXTERNAL_STAGING:
    "https://external-retool-staging.allocations.com/api/embed-url/external-user",
  EXTERNAL_PROD: "https://beta.allocations.com/api/embed-url/external-user",
  INTERNAL_STAGING:
    "https://internal-retool-staging.allocations.com/api/embed-url/external-user",
  INTERNAL_PROD:
    "https://internal-retool.allocations.com/api/embed-url/external-user",
};

const retoolApps = {
  migrations: {
    // the  Retool app being rendered
    landingPageUuid: "8c41a1d8-9cd6-11ed-87ee-333d48a5b286",
    // Retool permission group ids
    groupIds: [2],
    sessionDurationMinutes: 100,
    apiKey: process.env.RETOOL_INTERNAL_API_KEY,
    apiUrl: {
      staging: apiUrls.INTERNAL_STAGING,
      production: apiUrls.INTERNAL_PROD,
    },
  },
  migrationsFms: {
    landingPageUuid: "8c41a1d8-9cd6-11ed-87ee-333d48a5b286",
    groupIds: [2],
    sessionDurationMinutes: 100,
    apiKey: process.env.RETOOL_API_KEY,
    apiUrl: {
      staging: apiUrls.EXTERNAL_STAGING,
      production: apiUrls.EXTERNAL_PROD,
    },
  },
  onboarding: {
    landingPageUuid: "e141e3ac-8af5-11ed-8040-03c9e7358103",
    groupIds: [2],
    sessionDurationMinutes: 100,
    apiKey: process.env.RETOOL_API_KEY,
    apiUrl: {
      staging: apiUrls.EXTERNAL_STAGING,
    },
  },
  taxExternal: {
    landingPageUuid: "5ed2f2b2-7bc8-11ed-b184-1b27922e49dc",
    groupIds: [2],
    sessionDurationMinutes: 100,
    apiKey: process.env.RETOOL_API_KEY,
    apiUrl: {
      staging: apiUrls.EXTERNAL_STAGING,
      production: apiUrls.EXTERNAL_PROD,
    },
  },
  taxUpdate: {
    landingPageUuid: "e22ab0fa-b6dd-11ed-a68a-07bd1c7611c1",
    groupIds: [2],
    sessionDurationMinutes: 100,
    apiKey: process.env.RETOOL_API_KEY,
    apiUrl: {
      staging: apiUrls.EXTERNAL_STAGING,
      production: apiUrls.EXTERNAL_PROD,
    },
  },
};

module.exports = { retoolApps };
