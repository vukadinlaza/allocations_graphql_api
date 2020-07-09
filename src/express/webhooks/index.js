const { Router } = require('express');
const { connect } = require('../../mongo/index')
const convert = require('xml-js');

module.exports = Router()
  .post('/docusign', async (req, res, next) => {
    try {
    const { body } = req;
    const db = await connect();
    let docusignData = null;
    console.log('body',body)

    // if(body) {
    //   docusignData = convert.xml2json(body, {compact: true, spaces: 4});
    // } 
    console.log(docusignData)

    const user = await db.users.findOne({email: "lance@allocations.com"});

    return res.status(200).end();

    } catch (err) {
        next(err);
    }
  });