// API Documentation for docspring https://docspring.com/api-docs/index.html
const fetch = require("node-fetch");
class DocSpringApi {
  // Declare private fields
  #apiTokenId;
  #apiTokenSecret;
  #auth;
  #url;
  #headers;

  constructor(apiTokenId, apiTokenSecret) {
    this.#apiTokenId = apiTokenId;
    this.#apiTokenSecret = apiTokenSecret;
    this.#auth = Buffer.from(
      `${this.#apiTokenId}:${this.#apiTokenSecret}`
    ).toString("base64");
    this.#url = "https://api.docspring.com/api/v1";
    this.#headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${this.#auth}`,
    };
  }

  /**
   * @param {string} url - request url
   * @param {string} method - HTTP Method
   * @param {object} body
   * @returns {Promise}
   */
  async request(url, method, body = false) {
    return await fetch(url, {
      method,
      headers: this.#headers,
      body: body ? JSON.stringify(body) : null,
    });
  }

  /**
   * @typedef SubmissionDataResponse
   * @property {string} id
   * @property {string} state
   * @property {string} downloadUrl
   * @property {string} permanentDownloadUrl
   * @property {string} status
   */

  /**
   * Makes api call to get submission data.
   * @param {string} submissionId - the id for the submission we are looking for
   * @returns {Promise<SubmissionDataResponse>} - a promise the resolves to SubmissionDataResponse
   */
  async getSubmissionData(submissionId) {
    const response = await this.request(
      `${this.#url}/submissions/${submissionId}`,
      "GET"
    );

    if (response.status === 200) {
      const { id, state, download_url, permanent_download_url } = await response.json();
      //	When we make the call to get submission data immediately after generating a pdf
      //  the state will come back as pending and we won't have the permanent_download_url
      //  we use recursion and only return data once state = processed
      // ** Fixed this issue but for now we leave the check in place as this class evolves
      //  and get added methods
      if (state === "pending") {
        return await this.getSubmissionData(submissionId);
      }

      return {
        id,
        state,
        downloadUrl: download_url,
        permanentDownloadUrl: permanent_download_url,
        status: "success",
      };
    } else {
      const { status } = await response.json();
      return { status };
    }
  }

  /**
   * @typedef GeneratePdfResponse
   * @property {string} [id]
   * @property {string} [downloadUrl]
   * @property {string} [permanentDownloadUrl]
   * @property {string} status
   */

  /**
   * Makes api call to generate a pdf
   * @param {string} templateId - the id for the docspring template
   * @param {object} data 
   * @return {Promise<GeneratePdfResponse>} - a promise the resolves to GeneratePdfResponse
   */
  async generatePDF(templateId, data) {
    const response = await this.request(
      `${this.#url}/templates/${templateId}/submissions`,
      "POST",
      data
    );

    if (response.status === 201) {
      const { submission } = await response.json();

      // Prevents us from having to make a recursive call in getSubmissionData
      // by waiting 2 seconds before making an HTTP request
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(async () => {
          const { status, id, downloadUrl, permanentDownloadUrl } = await this.getSubmissionData(
            submission.id
          );
          if (status !== "success") {
            clearTimeout(timeoutId);
            reject(status);
          }

          clearTimeout(timeoutId);
          resolve({
            id,
            downloadUrl,
            status,
            permanentDownloadUrl
          });
        }, 2000);
      });
    } else {
      const { status } = await response.json();
      return { status };
    }
  }

  async getTemplate(templateId) {
    const response = await this.request(`${this.#url}/templates/${templateId}`, "GET")

    if (response.status === 200) {
      const data = await response.json();

      return {
        name: data.name,
        downloadUrl: data.document_url,
        permanentDocumentUrl: data.permanent_document_url,
        status: "success"
      }
    }
    else {
      const status = await response.json()
      return { status };
    }
  }
}

module.exports = {
  DocSpringApi,
};
