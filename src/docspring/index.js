// Find your API tokens here: https://app.docspring.com/api_tokens
require('dotenv').config();
const moment = require('moment')

const DocSpring = require('docspring');
const { capitalize, omit } = require('lodash');
const { ObjectId } = require('mongodb');
const { sendSPVDoc } = require('../mailers/spv-doc-mailer');
const { wFormSigned } = require('../zaps/signedDocs')
const { DocSpringApi } = require('./docspringApi');

var config = new DocSpring.Configuration()
config.apiTokenId = process.env.DOC_SPRING_API_ID
config.apiTokenSecret = process.env.DOC_SPRING_API_SECRET

let docspring = new DocSpring.Client(config)

const DocSpringAPI = new DocSpringApi(process.env.DOC_SPRING_API_ID, process.env.DOC_SPRING_API_SECRET)

const getTemplateData = (input, user, templateId) => {
  const {
    ssn,
    ein,
    title,
    state,
    country,
    pension,
    fullName,
    initials,
    legalName,
    individual,
    ira_account,
    sole_member,
    multi_member,
    home_address,
    investor_type,
    c_corporation,
    s_corporation,
    joint_tenants,
    mailing_address,
    revocable_trust,
    investmentAmount,
    irrevocable_trust,
    tenants_in_commons,
    general_partnership,
    limited_partnership,
    tenants_by_entirety,
    accredited_investor_status,
  } = input;

  const SIGNATURE_ONLY_TEMPLATE = 'tpl_ctrRDXgQdKz5YGg9QK';
  const oldTemplates = ['tpl_RrmjKbpFRr7qhKY3dD', 'tpl_xhqLHTtbGrLnS4tYRS', 'tpl_Z6jkb55rjqThssk3jG', 'tpl_ARmHkgKjECPmDT6ad9', 'tpl_3nKjygaFgz44KyCANJ', 'tpl_xhqLHTtbGrLnS4tYRS', 'tpl_RrmjKbpFRr7qhKY3dD']
  const isTypeIndividual = (investor_type === 'individual');
  const isTypeEntity = (investor_type === 'entity');
  const countryWithState = country + (country === 'United States' ? `, ${state}` : '');
  const nameToUse = isTypeIndividual ? legalName : fullName;
  const communeDeals = ['tpl_hK65xPJdKpgTPyks9H', 'tpl_Y6hNCEc6CqzNkqpyPp']
  const irishAngelsDeals = ['tpl_ratHTKYeHh9qcd2eYx']


  if (templateId === SIGNATURE_ONLY_TEMPLATE) {
    return {
      signature: nameToUse,
    }
  } else if (oldTemplates.includes(templateId)) {
    return {
      subscriptiondocsOne: capitalize(investor_type),
      subscriptiondocsTwo: legalName,
      investmentAmount: investmentAmount,
      subscriptiondocsThree: isTypeIndividual ? countryWithState : '',
      subscriptiondocsFour: isTypeEntity ? countryWithState : '',
      subscriptiondocsFive: isTypeIndividual ? accredited_investor_status : '',
      subscriptiondocsSix: isTypeIndividual ? '' : accredited_investor_status,
      email: user.email,
      fullName: nameToUse,
      signature: nameToUse,
      memberName: legalName,
      date: moment(new Date()).format('MM/DD/YYYY')
    }
  } else if (communeDeals.includes(templateId)) {
    return {
      'InvestorType': capitalize(investor_type),
      'MemberName': legalName,
      'SubAmount': investmentAmount,
      'USStateIndividual': isTypeIndividual ? countryWithState : '',
      'USStateEntity': isTypeEntity ? countryWithState : '',
      'AccredIndiv': isTypeIndividual ? accredited_investor_status : '',
      'AccredEntity': isTypeIndividual ? '' : accredited_investor_status,
      'Email': user.email,
      'FullName': nameToUse,
      'Signature': nameToUse,
      'Date Signed': moment(new Date()).format('MM/DD/YYYY'),
      'Title': title
    }
  } else if (irishAngelsDeals.includes(templateId)) {
    return {
      'InvestorType': capitalize(investor_type) || ' ',
      'MemberName': isTypeEntity ? legalName : ' ',
      'SubAmount': investmentAmount || ' ',
      'USStateIndividual': isTypeIndividual ? countryWithState : '',
      'USStateEntity': isTypeEntity ? countryWithState : '',
      'Email': user.email || ' ',
      'FullName': isTypeEntity ? nameToUse : ' ',
      'EntityName': isTypeEntity ? nameToUse : ' ',
      'InvestorName': isTypeIndividual ? (legalName || ' ') : (legalName || ' '),
      'IndividualName': isTypeIndividual ? nameToUse : ' ',
      'Signature': nameToUse,
      'EntitySignature': isTypeEntity ? nameToUse : ' ',
      'IndividualSignature': isTypeIndividual ? nameToUse : ' ',
      'Date Signed': moment(new Date()).format('MM/DD/YYYY'),
      'Title': isTypeEntity ? title : ' ',
      'EIN': isTypeEntity ? ein : ' ',
      'SocialSecurityNumber': isTypeIndividual ? ssn : ' ',
      'HomeAddress': home_address || ' ',
      'MailingAddress': mailing_address || ' ',
      'SoleMember': sole_member || false,
      'MultiMember': multi_member || false,
      'CCorporation': c_corporation || false,
      'SCorporation': s_corporation || false,
      'GeneralPartnership': general_partnership || false,
      'LimitedPartnership': limited_partnership || false,
      'IrrevocableTrust': irrevocable_trust || false,
      'RevocableTrust': revocable_trust || false,
      'IRAAccount': ira_account || false,
      'Pension': pension || false,
      'Individual': individual || false,
      'JointTenants': joint_tenants || false,
      'TenantsByEntirety': tenants_by_entirety || false,
      'TenantsInCommon': tenants_in_commons || false,
      'Initials': initials || ' '
    }
  } else {
    return {
      'InvestorType': capitalize(investor_type),
      'MemberName': legalName,
      'SubAmount': investmentAmount,
      'USStateIndividual': isTypeIndividual ? countryWithState : '',
      'USStateEntity': isTypeEntity ? countryWithState : '',
      'AccredIndiv': isTypeIndividual ? accredited_investor_status : '',
      'AccredEntity': isTypeIndividual ? '' : accredited_investor_status,
      'Email': user.email,
      'FullName': nameToUse,
      'Signature': nameToUse,
      'Date Signed': moment(new Date()).format('MM/DD/YYYY')
    }
  }
}


const updateInvestment = async (db, investmentStatus, payload, newDocsArray) => {
  const updatedInvestmentData = {
    status: investmentStatus === 'invited' ? 'signed' : investmentStatus,
    amount: parseFloat(payload.investmentAmount.replace(/,/g, '')),
    documents: newDocsArray
  }
  await db.investments.updateOne({ _id: ObjectId(payload.investmentId) }, { $set: updatedInvestmentData })
}


const addPacket = async (db, user, payload) => {
  const signingpacket = {
    userEmail: user.email,
    userId: user._id,
    authMethod: 'in-session',
    signedAt: new Date(),
    clientIp: payload.clientIp,
    investmentId: ObjectId(payload.investmentId),
    submissionData: {
      ...payload,
      userEmail: user.email,
      userId: user._id,
    }
  }
  await db.signingpackets.insertOne({ ...signingpacket })
}


const updateSubmissionData = async (error, response, db, investmentId) => {
  if (error) {
    console.log(response, error)
    throw error
  }

  let { submission } = response;
  await db.investments.updateOne({ _id: ObjectId(investmentId) }, {
    $set: { 'submissionData.submissionId': submission.id },
  })
  return submission
}


const updateUserDocuments = async (response, db, templateName, userId, payload) => {
  const { id, downloadUrl } = response;
  const docObj = {
    documentName: templateName,
    submissionId: id,
    docspringPermDownloadLink: downloadUrl
  }

  await db.users.updateOne({ _id: ObjectId(userId) }, {
    $push: { documents: docObj },
  })

  wFormSigned(payload);

  return new Promise((res, rej) => {
    return res(response)
  })
}


const generateDocSpringPDF = (db, deal, user, input, templateName, timeStamp, templateId) => {


  let data = getTemplateData(input, user, templateId);
  var submission_data = {
    editable: false,
    data: data,
    metadata: {
      user_id: user._id,
      investmentId: input.investmentId,
      templateName: templateName,
      timeStamp: timeStamp
    },
    field_overrides: {
      // title: {
      // 	required: false,
      // },
    },
  }


  docspring.generatePDF(templateId, submission_data, (error, response) => {


    const emailData = {
      pdfDownloadUrl: response.submission.download_url,
      email: user.email,
      deal
    }

    sendSPVDoc(emailData)

    return updateSubmissionData(error, response, db, input.investmentId)
  })
}


const createTaxDocument = async ({ payload, user, db }) => {

  const { kycTemplateName, kycTemplateId } = payload;
  const sig = kycTemplateName === 'W-9' ? payload.name_as_shown_on_your_income_tax_return_name_is_required_on_this_line_do_not_leave_this_line_blank : payload.signature;
  const keysToOmit = ['kycTemplateId', 'kycTemplateName', 'tax_classification', 'isDemo']
  const data = omit({ ...payload, signature: sig }, keysToOmit);

  var submission_data = {
    editable: false,
    data: data,
    metadata: {
      user_id: user._id,
      templateName: kycTemplateName
    },
    field_overrides: {
    },
    test: process.env.NODE_ENV === 'production' ? false : true,
    wait: true,
  }

  const response = await DocSpringAPI.generatePDF(kycTemplateId, submission_data);
  if (response.status !== 'success') return;
  return await updateUserDocuments(response, db, kycTemplateName, user._id, payload);
}


const getInvestmentPreview = async ({ input, user }) => {

  const { docSpringTemplateId } = input;

  let data = getTemplateData(input, user, docSpringTemplateId);


  var submission_data = {
    editable: false,
    data: data,
    metadata: {
      preview: true
    },
    field_overrides: {
    },
    test: process.env.NODE_ENV === 'production' ? false : true,
    wait: true,
  }

  return new Promise((resolve, reject) => {
    docspring.generatePDF(docSpringTemplateId, submission_data, (error, response) => {
      if (error) reject(error);
      return resolve(response.submission)
    })
  })
}


const getTemplate = ({ db, deal, payload, user, templateId, investmentDocs = [], investmentStatus }) => {
  // let template = await axios.get(`https://api.docspring.com/api/v1/templates/${templateId}`)
  return docspring.getTemplate(templateId, (error, template) => {
    if (error) {
      console.error(error);
      throw error
    } else {
      const timeStamp = Date.now();
      const adjTemplateName = template.name.replace(/\s+/g, "_");
      const key = `investments/${payload.investmentId}/${timeStamp}-${adjTemplateName}.pdf`;

      const oldDocs = investmentDocs.filter(doc => !doc.includes(adjTemplateName))
      const newDocsArray = [...oldDocs, key];

      generateDocSpringPDF(db, deal, user, payload, adjTemplateName, timeStamp, templateId);

      updateInvestment(db, investmentStatus, payload, newDocsArray);

      addPacket(db, user, payload)

      return template;

    }
  });
}





module.exports = { generateDocSpringPDF, getTemplate, createTaxDocument, getInvestmentPreview }
