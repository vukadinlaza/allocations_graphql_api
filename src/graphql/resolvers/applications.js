const { ObjectId } = require("mongodb")
const fetch = require('node-fetch');
const moment = require('moment')
const Applications = require('../schema/applications')
const Uploader = require('../../uploaders/application-docs')

/**

  Handles all exchange related requests

 **/

 const Schema = Applications

 const Queries = {
   application: async (_, { _id }, { user, db }) => {
     const application = await db.applications.findOne({ _id: ObjectId(_id) })
     return application
   }
 }

const Mutations = {
  /** Create deal application **/
  createApplication: async (_, { application }, { user, db }) => {
    const { pitchDocument } = application;

    if (pitchDocument) {
      const file = await pitchDocument;
      const s3Path = await Uploader.uploadPitchDoc(user._id, file, "pitch-document")
      application.pitchDocument = s3Path;
    }

    const newApplication = await db.applications.insertOne(application)
    const userApplications = user.dealApplications || [];
    userApplications.push(newApplication.insertedId)

    db.users.updateOne(
      { _id: ObjectId(user._id) },
      { $set: { ...user, dealApplications: userApplications } }
    )
    return newApplication
  }
}

module.exports = {
  Schema,
  Queries,
  Mutations
}