/* eslint-disable no-console */
const { Router } = require("express");
const { ObjectId } = require("mongodb");
const { get, every } = require("lodash");
const { getDB } = require("../../mongo/index");
const convert = require("xml-js");
const S3 = require("aws-sdk/clients/s3");
const fetch = require("node-fetch");
const moment = require("moment");
const { sendConfirmation } = require("../../mailers/signing-complete");
const s3 = new S3({ apiVersion: "2006-03-01" });
const { pubsub } = require("../../graphql/server");
const {
  newDirectionTransactionsAddRow,
  // bankTransactionsTransactionsTableOutbound,
  bankTransactionsTransactionsAddRow,
  findOrCreateBankingTransactionsAccount,
} = require("../../utils/airTable");
const Deals = require("../../graphql/datasources/Deals");
const {
  getReferenceNumber,
  getWireAmount,
} = require("../../utils/newDirections");
const { verifyWebhook } = require("../../auth");
const { SlackService } = require("@allocations/slack-service");
const { createCapitalAccountDoc } = require("../../docspring/index");
const Uploader = require("../../uploaders/investor-docs");
const { amountFormat } = require("../../utils/common");

let Bucket =
  process.env.NODE_ENV === "production"
    ? "allocations-encrypted"
    : process.env.AWS_S3_BUCKET;

module.exports = Router()
  .post("/docusign", async (req, res, next) => {
    try {
      const { rawBody } = req;
      const db = await getDB();

      const docusignData = JSON.parse(
        convert.xml2json(rawBody, { compact: true, spaces: 4 })
      );
      let lpRecipientStatus = get(
        docusignData,
        "DocuSignEnvelopeInformation.EnvelopeStatus.RecipientStatuses.RecipientStatus",
        {}
      );
      if (Array.isArray(lpRecipientStatus)) {
        lpRecipientStatus = get(lpRecipientStatus, "[0]");
      }
      // Gets User data from Docusign body
      const signerEmail = get(lpRecipientStatus, "Email._text", "");
      const signedAt = get(lpRecipientStatus, "Signed._text");
      const signerDocusignId = get(lpRecipientStatus, "RecipientId._text");

      // Gets Document/Envelope data
      const envelopeId = get(
        docusignData,
        "DocuSignEnvelopeInformation.EnvelopeStatus.EnvelopeID._text"
      );
      const name = get(
        docusignData,
        "DocuSignEnvelopeInformation.EnvelopeStatus.DocumentStatuses.DocumentStatus.Name._text"
      );
      const documentId = get(
        docusignData,
        "DocuSignEnvelopeInformation.EnvelopeStatus.DocumentStatuses.DocumentStatus.ID._text"
      );

      const documentName = encodeURI(name);

      let fieldData = get(lpRecipientStatus, "FormData.xfdf.fields.field", []);
      if (!Array.isArray(fieldData)) {
        fieldData = [fieldData];
      }

      const dealFeild = fieldData.find((f) => f._attributes.name === "Deal-ID");
      const emailfield = fieldData.find(
        (f) => f._attributes.name === "userEmail"
      );
      const dealId = get(dealFeild, "value._text");
      const userEmail = get(emailfield, "value._text");

      if (documentName.includes("Allocations Services Agreement")) {
        const atIdField = fieldData.find(
          (f) => f._attributes.name === "build-airtable-id"
        );
        const airTableId = get(atIdField, "value._text");
        const payload = {
          records: [
            {
              id: airTableId,
              fields: {
                ["Signed Provision of Service"]: true,
                ["Review"]: true,
              },
            },
          ],
        };
        const BASE = "appdPrRjapx8iYnIn";
        const TABEL_NAME = "Deals";
        await fetch(`https://api.airtable.com/v0/${BASE}/${TABEL_NAME}`, {
          method: "patch", // make sure it is a "PATCH request"
          body: JSON.stringify(payload),
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`, // API key
            "Content-Type": "application/json", // we will recive a json object
          },
        });
        return res.status(200).end();
      }
      let user = await db.users.findOne({ email: signerEmail.toLowerCase() });
      if (!user) {
        if (userEmail) {
          user = await db.users.findOne({ email: userEmail });
        }
        if (!user) {
          return res.status(400).end();
        }
      }
      if (dealId) {
        if (userEmail) {
          user = await db.users.findOne({ email: userEmail });
        }
        let investment = await db.investments.findOne({
          deal_id: ObjectId(dealId),
          user_id: ObjectId(user._id),
        });

        const deal = await db.deals.findOne({ _id: ObjectId(dealId) });
        if (investment === null) {
          investment = await db.investments.insertOne({
            user_id: ObjectId(user._id),
            deal_id: ObjectId(dealId),
            status: "invited",
            created_at: Date.now(),
            invitied_at: Date.now(),
            oranization: deal.organization,
            amount: 0,
          });
          investment._id = investment.insertedId;
        }
        const numDocs = (investment.documents || []).filter((d) => {
          return d.includes(documentName);
        });

        const tag = numDocs.length > 0 ? `${numDocs.length + 1}_` : "";
        const pdf = get(
          docusignData,
          "DocuSignEnvelopeInformation.DocumentPDFs.DocumentPDF.PDFBytes._text"
        );
        const key = `investments/${investment._id}/${tag}${documentName}`;
        const buf = Buffer.from(pdf, "base64");

        const obj = {
          Bucket,
          Key: key,
          Body: buf,
          ContentEncoding: "base64",
          ContentType: "application/pdf",
        };

        await s3.upload(obj).promise();

        investment = await db.investments.findOne({
          _id: ObjectId(investment._id),
        });

        const newStatus =
          investment.status === "wired" || investment.status === "complete"
            ? investment.status
            : "signed";
        await db.investments.updateMany(
          {
            deal_id: ObjectId(dealId),
            user_id: ObjectId(user._id),
          },
          {
            $set: { status: newStatus },
            $push: { documents: key },
          }
        );
        await sendConfirmation({ deal, to: user.email });
      }

      await db.users.findOneAndUpdate(
        { _id: ObjectId(user._id) },
        {
          $push: {
            documents: {
              signedAt,
              signerDocusignId,
              envelopeId,
              documentName,
              documentId,
            },
          },
        }
      );

      return res.status(200).end();
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .post("/verifyinvestor", async (req, res, next) => {
    try {
      const db = await getDB();
      const userId = get(req, "body.eapi_identifier");
      const status = get(req, "body.status");
      const verifyInvestorId = get(req, "body.investor_id");
      const requestId = get(req, "body.verification_request_id");

      if (userId && status === "accredited") {
        const cerficate = await fetch(
          `${process.env.VERIFY_INVESTOR_URL}/${requestId}/certificate`,
          {
            method: "get",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${process.env.VERIFY_INVESTOR_API_TOKEN}`,
            },
          }
        );

        const expirationDate = moment(Date.now()).add(90, "days").toDate();

        const key = `investors/${userId}/accredidation_doc`;

        const obj = {
          Bucket,
          Key: key,
          Body: cerficate.body,
          ContentType: "application/pdf",
        };
        await s3.upload(obj).promise();

        await db.users.findOneAndUpdate(
          { _id: ObjectId(userId) },
          {
            $push: {
              documents: {
                documentName: "Verify Investor Certificate",
                status,
                expirationDate,
                verifyInvestorId,
                requestId,
              },
            },
            $set: { accredidation_doc: key, accredidation_status: true },
          }
        );
      }

      if (userId && status === "not_accredited") {
        await db.users.findOneAndUpdate(
          { _id: ObjectId(userId) },
          {
            $set: { accredidation_status: false },
          }
        );
      }

      return res.status(200).end();
    } catch (err) {
      console.log(err);
      next(err);
    }
  })
  .post("/slack", async (req, res, next) => {
    try {
      res.sendStatus(200);
      next();
    } catch (err) {
      console.log("post /slack error :>> ", err);
      next(err);
    }
  })
  .post("/bankwire-notifications", async (req, res, next) => {
    try {
      const { body } = req;

      const db = await getDB();
      const deals = await db.deals
        .find({ company_name: body.dealName })
        .toArray();
      const user = await db.users.findOne({ email: body.email.toLowerCase() });
      if (!user._id || !every(deals, "_id")) {
        return res.sendStatus(200);
      }
      const dealIds = deals.map((d) => d._id).filter((d) => d);
      await db.investments.updateMany(
        {
          user_id: user._id,
          deal_id: {
            $in: dealIds,
          },
        },
        { $set: { status: "wired" } }
      );
      res.sendStatus(200);
      next();
    } catch (err) {
      console.log("bankwire-notifications :>> ", err);
      next(err);
    }
  })
  .post("/wire-lookup", async (req, res, next) => {
    try {
      const verified = verifyWebhook(req.headers.authorization);

      if (!verified) {
        res.sendStatus(401);
        throw new Error("Invalid token");
      }
      const { body } = req;
      const { user_id } = body;

      const db = await getDB();
      const user = await db.users.findOne({
        _id: ObjectId(user_id),
      });

      if (!user) {
        throw new Error(`Unable to find user with _id: ${user_id}.`);
      }

      await res.send(user);
    } catch (err) {
      console.log("wire-lookup :>> ", err);
      next(err);
    }
  })
  .post("/wire-status-update", async (req, res, next) => {
    try {
      const verified = verifyWebhook(req.headers.authorization);

      if (!verified) {
        res.sendStatus(401);
        throw new Error("Invalid token");
      }
      const { body } = req;
      const { investmentId, status, wiredAmount, wiredDate } = body;

      const db = await getDB();
      const legacyInvestment = await db.investments.findOne({
        _id: ObjectId(investmentId),
      });

      const serviceResponse = await fetch(
        `${process.env.INVEST_API_URL}/api/v1/investments/investment-by-id/${investmentId}`,
        {
          method: "GET",
          headers: {
            "x-api-token": process.env.ALLOCATIONS_TOKEN,
          },
        }
      );

      const serviceInvestment = await serviceResponse.json();

      if (!legacyInvestment && !serviceInvestment) {
        throw new Error(
          `Unable to update wire status for investment _id: ${investmentId}. Not found.`
        );
      }

      if (legacyInvestment) {
        const epochWireDate = new Date(wiredDate).getTime();
        await db.investments.updateOne(
          { _id: ObjectId(investmentId) },
          {
            $set: {
              status: status,
              capitalWiredAmount: wiredAmount,
              wired_at: epochWireDate,
            },
          }
        );

        const updatedLegacyInvestment = await db.investments.findOne({
          _id: ObjectId(investmentId),
        });

        if (!updatedLegacyInvestment.status === status)
          console.warn(
            `Failed to update wire status for legacy investment with _id:${investmentId}.`
          );

        await res.send(updatedLegacyInvestment);
      } else {
        console.warn(
          `No legacy investment found with _id:${investmentId}. Attempting to update service investment.`
        );

        const investmentData = {
          phase: "wired",
          wired_amount: wiredAmount,
          wired_date: wiredDate,
        };

        const serviceResponse = await fetch(
          `${process.env.INVEST_API_URL}/api/v1/investments/${investmentId}`,
          {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
              "x-api-token": process.env.ALLOCATIONS_TOKEN,
            },
            body: JSON.stringify(investmentData),
          }
        );
        const serviceInvestment = await serviceResponse.json();
        await res.send(serviceInvestment);
      }
    } catch (err) {
      console.log("wire-status-update :>> ", err);
      next(err);
    }
  })
  .post("/process-street-spv", async (req, res, next) => {
    try {
      const db = await getDB();
      const { body } = req;
      const { data } = body;
      const dealData = {
        psDealId: data.id,
        dealName: data.name,
        dealCreatedDate: data.audit.createdDate,
        dealUpdatedDate: data.audit.updatedDate,
        dealUpdatedBy: data.audit.updatedBy.email,
        psTemplate: data.template.name,
        dealTasks: data.tasks.map((t) => {
          return {
            taskId: t.taskTemplateGroupId,
            taskName: t.name,
            taskStatus: t.status,
            taskUpdatedDate: t.updatedDate,
            taskUpdatedBy: t.updatedBy.email,
          };
        }),
      };
      const dealOnboarded = await db.dealOnboarding.findOne({
        psDealId: dealData.psDealId,
      });
      if (dealOnboarded)
        return res
          .status(400)
          .send(
            `The dealOnboarding with psDealId: ${dealData.psDealId} already exists`
          );

      const onboarded = await db.dealOnboarding.insertOne(dealData);

      if (onboarded.insertedCount) {
        pubsub.publish("dealOnboarding", { dealOnboarding: dealData });
        return res.sendStatus(200);
      }
      return res
        .status(400)
        .send(
          `There was a problem creating dealOnboarding with psDealId: ${dealData.psDealId}`
        );
    } catch (err) {
      console.log("Error on Process Street Workflow Run :>> ", err);
      next(err);
    }
  })
  .post("/process-street-tasks", async (req, res, next) => {
    try {
      const db = await getDB();
      const { body } = req;
      const {
        data,
        data: {
          checklist: { id: psDealId },
        },
      } = body;

      const taskData = {
        taskId: data.taskTemplateGroupId,
        taskName: data.name,
        taskStatus: data.status,
        taskUpdatedDate: data.updatedDate,
        taskUpdatedBy: data.updatedBy.email,
        taskCompletedDate: data.completedDate,
        taskCompletedBy: data.completedBy ? data.completedBy.name : "",
        formFields: data.formFields
          ? data.formFields.map((f) => {
              return {
                fieldLabel: f.label,
                fieldType: f.type,
                fieldValue: f.value,
              };
            })
          : [],
      };

      const onboardedDeal = await db.dealOnboarding.findOne({ psDealId });
      if (!onboardedDeal)
        return res
          .status(400)
          .send(`There are no deals with the psDealId: ${psDealId}`);

      const currentTaskIndex = onboardedDeal.dealTasks.findIndex(
        (task) => task.taskId === taskData.taskId
      );
      onboardedDeal.dealTasks[currentTaskIndex] = taskData;
      const updatedDeal = await db.dealOnboarding.updateOne(
        { _id: ObjectId(onboardedDeal._id) },
        { $set: { dealTasks: onboardedDeal.dealTasks } }
      );

      if (updatedDeal.modifiedCount) {
        pubsub.publish("dealOnboarding", { dealOnboarding: taskData });
        return res.sendStatus(200);
      }
      return res
        .status(400)
        .send(
          `There was a problem updating dealOnboarding with psDealId: ${psDealId}`
        );
    } catch (err) {
      console.log("Error on Process Street Task update :>> ", err);
      next(err);
    }
  })
  .post("/nd-bank-wire-confirmation", async (req, res, next) => {
    let emailLink;
    let deal;
    let referenceNumber;
    let amount;
    let investment;
    const db = await getDB();

    try {
      const verified = verifyWebhook(req.headers.authorization);

      if (!verified) {
        res.sendStatus(401);
        throw new Error("Invalid token");
      }

      const DealService = new Deals(db.collection("deals"));

      const { body } = req;
      const email = body.body;
      emailLink = body.emailLink;
      referenceNumber = getReferenceNumber(email);
      amount = getWireAmount(email);
      investment = await db.investments.findOne({
        "wire_instructions.reference_number": referenceNumber,
      });

      console.log("INVESTMENT", investment);
      if (!investment) {
        throw new Error("No Investment Found.");
      }

      const {
        _id: investmentId,
        deal_id,
        user_id,
        submissionData: { legalName },
      } = investment;

      deal = await DealService.getDealById({ deal_id });

      if (!deal) throw new Error("No Deal Found");
      if (!deal.virtual_account_number)
        throw new Error("No Virtual Account Number");
      const { virtual_account_number } = deal;

      console.log("AMOUNT", amount);

      await newDirectionTransactionsAddRow({
        virtualAccountNumber: virtual_account_number,
        amount,
        referenceNumber,
        deal_id,
        investmentId,
        user_id,
      });

      const account = await findOrCreateBankingTransactionsAccount({
        virtualAccountNumber: virtual_account_number,
        deal_name: deal.company_name,
      });

      await bankTransactionsTransactionsAddRow({
        user_name: legalName,
        referenceNumber,
        account,
        amount,
      });

      const investor = await db
        .collection("users")
        .findOne({ _id: investment.user_id });
      await SlackService.ndIncomingWire({
        deal,
        investor,
        amount,
        emailLink,
      });
      res.sendStatus(200);
      next();
    } catch (err) {
      console.log("nd-bank-wire-confirmation error :>> ", err);
      console.log("err.message ", err.message);
      console.log("err entries ", Object.entries(err));

      const deal_id = deal ? deal._id : "N/A";
      const investment_id = investment ? investment._id : "N/A";
      await SlackService.postNDError({
        action: "INCOMING WIRE",
        error: err.message || "Trouble processing inbound wire",
        details: { referenceNumber, amount, deal_id, investment_id },
        emailLink,
      });

      next(err);
    }
  })
  // clone of /nd-bank-wire-confirmation with modified returns to be used in zapier for slack messaging
  .post("/nd-bank-incoming-wire", async (req, res) => {
    let emailLink;
    let deal;
    let referenceNumber;
    let amount;
    let investment;
    const db = await getDB();

    try {
      const verified = verifyWebhook(req.headers.authorization);

      if (!verified) {
        res.sendStatus(401);
        throw new Error("Invalid token");
      }

      const DealService = new Deals(db.collection("deals"));

      const { body } = req;
      const email = body.body;
      emailLink = body.emailLink;

      referenceNumber = getReferenceNumber(email);
      amount = getWireAmount(email);

      investment = await db.investments.findOne({
        "wire_instructions.reference_number": referenceNumber,
      });

      if (!investment) throw new Error("No Investment Found.");

      const {
        _id: investmentId,
        deal_id,
        user_id,
        submissionData: { legalName },
      } = investment;

      deal = await DealService.getDealById({ deal_id });

      if (!deal) throw new Error("No Deal Found");
      if (!deal.virtual_account_number)
        throw new Error("No Virtual Account Number");
      const { virtual_account_number } = deal;

      console.log("AMOUNT", amount);

      await newDirectionTransactionsAddRow({
        virtualAccountNumber: virtual_account_number,
        amount,
        referenceNumber,
        deal_id,
        investmentId,
        user_id,
      });

      const account = await findOrCreateBankingTransactionsAccount({
        virtualAccountNumber: virtual_account_number,
        deal_name: deal.company_name,
      });

      await bankTransactionsTransactionsAddRow({
        user_name: legalName,
        referenceNumber,
        account,
        amount,
      });

      const investor = await db
        .collection("users")
        .findOne({ _id: investment.user_id });

      let investorName;
      if (investor.signer_full_name) investorName = investor.signer_full_name;
      else if (investor.first_name && investor.last_name)
        investorName = `${investor.first_name} ${investor.last_name}`;
      else investorName = "N/A";

      const slackMessage = `New Incoming Wire
        Deal Company Name: ${deal.company_name}
        Deal ID: ${deal._id}
        Investor Name: ${investorName}
        Entity: ${investor.entity || "N/A"}
        Email: ${investor.email || "N/A"}
        Amount: ${amount}
        Email Link: ${emailLink}
        `;
      res.send({ slackMessage });
    } catch (err) {
      console.log("nd-bank-wire-confirmation error :>> ", err);
      console.log("err.message ", err.message);
      console.log("err entries ", Object.entries(err));

      const deal_id = deal ? deal._id : "N/A";
      const investment_id = investment ? investment._id : "N/A";

      const formatErrorDetails = (details) => {
        if (!details) return "N/A";
        // For all properties within the details obj, create a new line of the key and value with spacing
        // ex details = { name: 'jim' } => '               name: jim
        return Object.keys(details).reduce((acc, val) => {
          const key = val;
          const value = details[val];
          const newLine = `\n         ${key}: ${value}`;
          return acc.concat(newLine);
        }, "");
      };

      const error =
        err && err.message ? err.message : "Error in ND Incoming wire.";

      const slackMessage = `Error @here
      Action: "ND Incoming Wire Err"
      Error: ${error}
      Details: ${formatErrorDetails(
        { referenceNumber, amount, deal_id, investment_id } || {}
      )}
      Email Link: ${emailLink}
      `;

      res.send({ slackMessage });
    }
  })
  .post("/create-capital-accounts-document", async (req, res, next) => {
    try {
      const db = await getDB();

      const { body } = req;

      //find the matching investment with userId and dealId
      //would like to move away from this by getting the investmentID
      const matchingInvestment = await db.investments.findOne({
        user_id: ObjectId(body.userId),
        deal_id: ObjectId(body.dealId),
      });

      //check the db to see if investment has cap account doc
      const hasCapAcctDoc = matchingInvestment?.documents?.find((doc) =>
        doc.includes("Capital_Account_Statement")
      );

      if (hasCapAcctDoc) {
        return res.send("Already has cap account doc");
      }
      //append current date to the data to send to docspring
      const formattedData = {
        name: body.name,
        effectiveDate: moment(body.effectiveDate).format("MMMM DD, YYYY"),
        subscriptionAmount: `$${amountFormat(body.subscriptionAmount)}`,
        privateFundExpenses: `$${amountFormat(body.privateFundExpenses)}`,
        managementFee: `$${amountFormat(body.managementFee)}`,
        //might need to change b/c airtable might send number not string
        carryPercent: `${Number(body.carryPercent) * 100}%`,
        //might need to change b/c airtable might send number not string
        ownershipPercentage: `${Number(body.ownershipPercentage) * 100}%`,
        netInvestmentAmount: `$${amountFormat(body.netInvestmentAmount)}`,
        currentDate: moment().format("MMMM DD, YYYY"),
      };

      // creates a new document
      const docspringRes = await createCapitalAccountDoc({
        payload: formattedData,
      });
      const downloadURL = await fetch(docspringRes.download_url);

      const timeStamp = Date.now();

      const buffer = await downloadURL.arrayBuffer();
      const s3Path = await Uploader.putInvestmentCapitalAccount(
        matchingInvestment._id,
        buffer,
        timeStamp,
        "Capital Account Statement"
      );

      await db.investments.updateOne(
        { _id: ObjectId(matchingInvestment._id) },
        {
          $push: {
            documents: `${s3Path}`,
          },
        }
      );
      const updatedInvestment = await db.investments.findOne({
        _id: ObjectId(matchingInvestment._id),
      });

      res.send(updatedInvestment);
    } catch (err) {
      next(err);
    }
  });
