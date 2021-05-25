
module.exports = function template ({ data: { username, issuer, price, totalAmount, deadline } }) {
  return `

    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
        <!--[if !mso]><!-->
          <meta http-equiv="X-UA-Compatible" content="IE=Edge">
          <!--<![endif]-->
          <!--[if (gte mso 9)|(IE)]>
            <xml>
              <o:OfficeDocumentSettings>
              <o:AllowPNG/>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
          <![endif]-->
          <!--[if (gte mso 9)|(IE)]>
            <style type="text/css">
              body {width: 600px;margin: 0 auto;}
              table {border-collapse: collapse;}
              table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}
              img {-ms-interpolation-mode: bicubic;}
            </style>
            <![endif]-->
            <style type="text/css">
              body, p, div {
                font-family: arial,helvetica,sans-serif;
                font-size: 14px;
              }
              body {
                color: #000000;
              }
              body a {
                color: #1188E6;
                text-decoration: none;
              }
              p { margin: 0; padding: 0; }
              table.wrapper {
                width:100% !important;
                table-layout: fixed;
                -webkit-font-smoothing: antialiased;
                -webkit-text-size-adjust: 100%;
                -moz-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
              }
              .im {
                color: #333 !important;
              }
              img.max-width {
                max-width: 100% !important;
              }
              .column.of-2 {
                width: 50%;
              }
              .column.of-3 {
                width: 33.333%;
              }
              .column.of-4 {
                width: 25%;
              }
              .paragraph {
                padding:10px 0px;
                line-height:30px;
                text-align:inherit;
              }
              .paragraph.bullet {
                padding:0px;
              }
              .bullet.value {
                font-weight: 600;
                padding-left: 1em
              }
              @media screen and (max-width:480px) {
                .preheader .rightColumnContent,
                .footer .rightColumnContent {
                  text-align: left !important;
                }
                .preheader .rightColumnContent div,
                .preheader .rightColumnContent span,
                .footer .rightColumnContent div,
                .footer .rightColumnContent span {
                  text-align: left !important;
                }
                .preheader .rightColumnContent,
                .preheader .leftColumnContent {
                  font-size: 80% !important;
                  padding: 5px 0;
                }
                table.wrapper-mobile {
                  width: 100% !important;
                  table-layout: fixed;
                }
                img.max-width {
                  height: auto !important;
                  max-width: 100% !important;
                }
                a.bulletproof-button {
                  display: block !important;
                  width: auto !important;
                  font-size: 80%;
                  padding-left: 0 !important;
                  padding-right: 0 !important;
                }
                .columns {
                  width: 100% !important;
                }
                .column {
                  display: block !important;
                  width: 100% !important;
                  padding-left: 0 !important;
                  padding-right: 0 !important;
                  margin-left: 0 !important;
                  margin-right: 0 !important;
                }
                .social-icon-column {
                  display: inline-block !important;
                }
              }
            </style>
            <!--user entered Head Start--><!--End Head user entered-->
          </head>
          <body>
            <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:14px; font-family:arial,helvetica,sans-serif; color:#000000; background-color:#FFFFFF;">
              <div class="webkit">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF">
                  <tbody>
                    <tr>
                      <td valign="top" bgcolor="#FFFFFF" width="100%">
                        <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                          <tbody>
                            <tr>
                              <td width="100%">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tbody>
                                    <tr>
                                      <td>
                                        <!--[if mso]>
                                          <center>
                                            <table>
                                              <tr>
                                                <td width="600">
                                                  <![endif]-->
                                                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                                    <tbody>
                                                      <tr>
                                                        <td role="modules-container" style="padding:10px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left">
                                                          <table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
                                                            <tbody>
                                                              <tr>
                                                                <td role="module-content">
                                                                  <p></p>
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>

                                                          <!-- Logo -->

                                                          <table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="b276c771-f9f7-49f0-b6c2-7fd72e92c358">
                                                            <tbody>
                                                              <tr>
                                                                <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
                                                                  <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:50% !important; width:50%; height:auto !important;" width="300" alt="" data-proportionally-constrained="true" data-responsive="true" src="https://allocations-public.s3.us-east-2.amazonaws.com/logo-new.png">
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>

                                                          <!-- Start of Content -->

                                                          <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="4d2d501d-dd9e-4e74-9bc4-6eebdaae4635" data-mc-module-version="2019-10-22">
                                                            <tbody>
                                                              <tr>
                                                                <td class="paragraph" height="100%" valign="top" bgcolor="" role="module-content">
                                                                  <div>
                                                                    <div style="font-family: inherit; text-align: start">
                                                                      <span style="font-family: helvetica, sans-serif;">
                                                                        Dear ${username},
                                                                      </span>
                                                                    </div>
                                                                    <div>
                                                                    </div>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph" height="100%" valign="top" bgcolor="" role="module-content" colspan="2">
                                                                  <div>
                                                                    <div style="font-family: inherit; text-align: start">
                                                                      <span style="font-family: helvetica, sans-serif;">
                                                                        Thank you for your commitment to invest through Allocations Crowdfunding!
                                                                      </span>
                                                                    </div>
                                                                    <div>
                                                                    </div>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph" height="100%" valign="top" bgcolor="" role="module-content" colspan="2">
                                                                  <div>
                                                                    <div style="font-family: inherit; text-align: start">
                                                                      <span style="font-family: helvetica, sans-serif;">
                                                                        This is a notice to confirm your commitment.
                                                                      </span>
                                                                    </div>
                                                                    <div style="font-family: inherit; text-align: start">
                                                                      <span style="font-family: helvetica, sans-serif;">
                                                                        Please find below the relevant details pertaining to your investment:
                                                                      </span>
                                                                    </div>
                                                                    <div>
                                                                    </div>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph bullet" height="100%" valign="top" bgcolor="" role="module-content" style="padding-top: 10px">
                                                                  <div style="font-family: inherit; text-align: start">
                                                                    <span style="font-family: helvetica, sans-serif;">
                                                                      Name of Issuer:
                                                                    </span>
                                                                  </div>
                                                                </td>
                                                                <td class="paragraph bullet value" height="100%" valign="top" bgcolor="" role="module-content" style="padding-top: 10px">
                                                                  <div style="font-family: inherit; text-align: start">
                                                                    <span style="font-family: helvetica, sans-serif;">
                                                                      ${issuer}
                                                                    </span>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph bullet" height="100%" valign="top" bgcolor="" role="module-content">
                                                                  <div style="font-family: inherit; text-align: start">
                                                                    <span style="font-family: helvetica, sans-serif;">
                                                                      Price of the Securities:
                                                                    </span>
                                                                  </div>
                                                                </td>
                                                                <td class="paragraph bullet value" height="100%" valign="top" bgcolor="" role="module-content">
                                                                  <div style="font-family: inherit; text-align: start">
                                                                    <span style="font-family: helvetica, sans-serif;">
                                                                      ${price}
                                                                    </span>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph bullet" height="100%" valign="top" bgcolor="" role="module-content">
                                                                  <div style="font-family: inherit; text-align: start">
                                                                    <span style="font-family: helvetica, sans-serif;">
                                                                      Total amount committed by you:
                                                                    </span>
                                                                  </div>
                                                                </td>
                                                                <td class="paragraph bullet value" height="100%" valign="top" bgcolor="" role="module-content">
                                                                  <div style="font-family: inherit; text-align: start">
                                                                    <span style="font-family: helvetica, sans-serif;">
                                                                      ${totalAmount}
                                                                    </span>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph bullet" height="100%" valign="top" bgcolor="" role="module-content" style="padding-bottom: 10px">
                                                                  <div style="font-family: inherit; text-align: start">
                                                                    <span style="font-family: helvetica, sans-serif;">
                                                                      Deadline date and time to cancel commitment:
                                                                    </span>
                                                                  </div>
                                                                </td>
                                                                <td class="paragraph bullet value" height="100%" valign="top" bgcolor="" role="module-content" style="padding-bottom: 10px">
                                                                  <div style="font-family: inherit; text-align: start">
                                                                    <span style="font-family: helvetica, sans-serif;">
                                                                      ${deadline}
                                                                    </span>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph" height="100%" valign="top" bgcolor="" role="module-content" colspan="2">
                                                                  <div>
                                                                    <div style="font-family: inherit; text-align: start">
                                                                      <span style="font-family: helvetica, sans-serif;">
                                                                        Should you wish to cancel your commitment or if you have any questions pertaining to your investment, do not hesitate to contact us at
                                                                        <a href = "mailto: support@allocationscf.com">support@allocationscf.com</a>.
                                                                      </span>
                                                                    </div>
                                                                    <div>
                                                                    </div>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph" height="100%" valign="top" bgcolor="" role="module-content" colspan="2">
                                                                  <div>
                                                                    <div style="font-family: inherit; text-align: start">
                                                                      <span style="font-family: helvetica, sans-serif;">
                                                                        Please refer to our educational materials in your Allocations Crowdfunding Home Page for further information on the investment process, cancellation options and risks associated with such investments.
                                                                      </span>
                                                                    </div>
                                                                    <div>
                                                                    </div>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph" height="100%" valign="top" bgcolor="" role="module-content" colspan="2">
                                                                  <div>
                                                                    <div style="font-family: inherit; text-align: start">
                                                                      <span style="font-family: helvetica, sans-serif;">
                                                                        Best regards,
                                                                      </span>
                                                                    </div>
                                                                    <div>
                                                                    </div>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                              <tr>
                                                                <td class="paragraph" height="100%" valign="top" bgcolor="" role="module-content" colspan="2">
                                                                  <div>
                                                                    <div style="font-family: inherit; text-align: start">
                                                                      <span style="font-family: helvetica, sans-serif;">
                                                                        The Allocations Crowdfunding Team
                                                                      </span>
                                                                    </div>
                                                                    <div>
                                                                    </div>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>

                                                          <!-- End of Content -->

                                                          <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="d13ed318-e363-46cd-bb41-10d12348955e">
                                                            <tbody>
                                                              <tr>
                                                                <td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>

                                                          <!-- Disclaimer -->

                                                          <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="e458197e-0a71-4758-8251-344c387368fd" data-mc-module-version="2019-10-22">
                                                            <tbody>
                                                              <tr>
                                                                <td style="padding:18px 10px 18px 10px; line-height:12px; text-align:inherit; background-color:#ebebeb;" height="100%" valign="top" bgcolor="#ebebeb" role="module-content">
                                                                  <div>
                                                                    <div style="font-family: inherit; text-align: inherit">
                                                                      <span style="font-size: 9px">
                                                                        Disclaimer: This email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to whom they are addressed. Please note this email and files are not legal, tax, accounting or investment advice. Allocations Crowdfunding is a funding portal, not a broker dealer or investment adviser, operated by Allocations Crowdfunding LLC.
                                                                      </span>
                                                                    </div>
                                                                    <div>
                                                                    </div>
                                                                  </div>
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>


                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                  <!--[if mso]>
                                                  </td>
                                                </tr>
                                              </table>
                                            </center>
                                            <![endif]-->
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </center>
              </body>
          </html>
  `
}
