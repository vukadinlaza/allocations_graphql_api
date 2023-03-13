const retoolApps = {
  migrations: {
    staging: {
      apiUrl:
        "https://internal-retool-staging.allocations.com/api/embed-url/external-user",
      landingPageUuid: "8c41a1d8-9cd6-11ed-87ee-333d48a5b286",
      groupIds: [2],
      sessionDurationMinutes: 100,
      apiKey: process.env.RETOOL_INTERNAL_API_KEY,
    },
    production: {
      apiUrl:
        "https://internal-retool.allocations.com/api/embed-url/external-user",
      landingPageUuid: "8c41a1d8-9cd6-11ed-87ee-333d48a5b286",
      groupIds: [2],
      sessionDurationMinutes: 100,
      apiKey: process.env.RETOOL_INTERNAL_API_KEY,
    },
  },
  onboarding: {
    apiUrl:
      "https://external-retool-staging.allocations.com/api/embed-url/external-user",
    // the first Retool app being rendered
    landingPageUuid: "e141e3ac-8af5-11ed-8040-03c9e7358103",
    // Retool permission group ids
    groupIds: [2],
    sessionDurationMinutes: 100,
    apiKey: process.env.RETOOL_API_KEY,
  },
  taxExternal: {
    staging: {
      apiUrl:
        "https://external-retool-staging.allocations.com/api/embed-url/external-user",
      landingPageUuid: "5ed2f2b2-7bc8-11ed-b184-1b27922e49dc",
      groupIds: [2],
      sessionDurationMinutes: 100,
      apiKey: process.env.RETOOL_API_KEY,
    },
    production: {
      apiUrl: "https://beta.allocations.com/api/embed-url/external-user",
      landingPageUuid: "5ed2f2b2-7bc8-11ed-b184-1b27922e49dc",
      groupIds: [2],
      sessionDurationMinutes: 100,
      apiKey: process.env.RETOOL_API_KEY,
    },
  },
  taxUpdate: {
    staging: {
      apiUrl:
        "https://external-retool-staging.allocations.com/api/embed-url/external-user",
      landingPageUuid: "e22ab0fa-b6dd-11ed-a68a-07bd1c7611c1",
      groupIds: [2],
      sessionDurationMinutes: 100,
      apiKey: process.env.RETOOL_API_KEY,
    },
    production: {
      apiUrl: "https://beta.allocations.com/api/embed-url/external-user",
      landingPageUuid: "e22ab0fa-b6dd-11ed-a68a-07bd1c7611c1",
      groupIds: [2],
      sessionDurationMinutes: 100,
      apiKey: process.env.RETOOL_API_KEY,
    },
  },
};

module.exports = { retoolApps };
