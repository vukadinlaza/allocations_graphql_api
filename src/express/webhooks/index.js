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
const { regexp } = require("express-xml-bodyparser");

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
      const documentName = get(
        docusignData,
        "DocuSignEnvelopeInformation.EnvelopeStatus.DocumentStatuses.DocumentStatus.Name._text"
      );
      const documentId = get(
        docusignData,
        "DocuSignEnvelopeInformation.EnvelopeStatus.DocumentStatuses.DocumentStatus.ID._text"
      );

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
  .post("/nd-bank-wire-notification", async (req, res, next) => {
    try {
      const { body } = req;

      const db = await getDB();
      console.log("BODY", body);

      const regex = new RegExp(
        /Originator(\D+)to(\D+)Beneficiary(\D+)Information(\D+)(?<refNum>\d+)/
      );
      const referenceName = regex.exec(body.body);
      console.log(referenceName.groups.refNum);

      res.sendStatus(200);
      next();
    } catch (err) {
      console.log("bankwire-notifications :>> ", err);
      next(err);
    }
  });
