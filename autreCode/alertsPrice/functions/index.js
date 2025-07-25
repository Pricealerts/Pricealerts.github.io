const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

admin.initializeApp();

exports.proxyRequest = onRequest(
  { region: "europe-west1" },
  async (req, res) => {
    const baseUrl = req.method === "POST" ? req.body.url : req.query.url;

    if (!baseUrl) {
      return res
        .status(400)
        .json({ error: "The 'url' parameter is required." });
    }

    try {
      const response = await axios.get(baseUrl);

      // إذا كان الرد يحتوي على HTML بدل JSON
      if (typeof response.data === "string" && response.data.startsWith("<")) {
        return res.status(500).json({
          error: "Received HTML instead of JSON (possibly blocked or invalid URL).",
          raw: response.data.slice(0, 1000),
        });
      }

      // إرسال البيانات كـ JSON
      return res.status(200).json(response.data);
    } catch (error) {
      logger.error("Axios error:", error.message);
      return res.status(500).json({
        error: "Failed to fetch data",
        details: error.message,
      });
    }
  }
);
