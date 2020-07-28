const HelloSign = require('hellosign-sdk')

const { HELLOSIGN_API_KEY, NODE_ENV } = process.env
const helloSign = HelloSign({ key: HELLOSIGN_API_KEY })
const clientId = "eda2d58dfbeed4f5eaf8d94a545f7dc5"

const test_mode = 1

async function createRequest(user, template_id) {
  const options = {
    test_mode,
    clientId,
    template_id,
    signers: [
      {
        email_address: user.email,
        name: user.signer_full_name,
        role: 'Manager'
      }
    ],
    custom_fields: [
      {
        name: "Full_Name",
        value: user.signer_full_name,
        editor: "Manager"
      },
      {
        name: "Email",
        value: user.email,
        editor: "Manager"
      },
      {
        name: "Address",
        value: "",
        editor: "Manager"
      }
    ]
  }
  const res = await helloSign.signatureRequest.createEmbeddedWithTemplate(options)
  return res.signature_request
}

async function getSignUrl(signature_id) {
  const { embedded } = await helloSign.embedded.getSignUrl(signature_id)
  return embedded.sign_url
}

async function listRequests(user) {
  const reqs = await helloSign.signatureRequest.list()
  return reqs
}

async function listTemplates() {
  // const { templates } = await helloSign.template.list()
  // return templates.map(t => ({ _id: t.template_id, title: t.title }))
}

module.exports = { createRequest, listRequests, listTemplates, getSignUrl }