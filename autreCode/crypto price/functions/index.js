const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// إعدادات عامة (يمكنك تغيير region أو cpu)
setGlobalOptions({
  region: "us-central1",
  cpu: 1
});

exports.getPriceKucoin = onRequest((req, res) => {
  cors(req, res, async () => {
    const symbol = req.query.symbol || "BTC-USDT";
    try {
      const response = await axios.get(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}`);
      const price = response.data.data.price;
      res.json({ price });
    } catch (error) {
      res.status(500).json({ error: "KuCoin API error", details: error.message });
    }
  });
});

exports.getPriceBinance = onRequest((req, res) => {
  cors(req, res, async () => {
    const symbol = (req.query.symbol || "BTC-USDT").replace("-", "");
    try {
      const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const price = response.data.price;
      res.json({ price });
    } catch (error) {
      res.status(500).json({ error: "Binance API error", details: error.message });
    }
  });
});

exports.getPriceBybit = onRequest((req, res) => {
  cors(req, res, async () => {
    const symbol = req.query.symbol || "BTC-USDT";
    try {
      const response = await axios.get(`https://api.bybit.com/v2/public/tickers?symbol=${symbol}`);
      const price = response.data.result[0].last_price;
      res.json({ price });
    } catch (error) {
      res.status(500).json({ error: "Bybit API error", details: error.message });
    }
  });
});

exports.getPriceGateio = onRequest((req, res) => {
  cors(req, res, async () => {
    const symbol = (req.query.symbol || "BTC-USDT").replace("-", "_");
    try {
      const response = await axios.get(`https://api.gate.io/api2/1/ticker/${symbol}`);
      const price = response.data.last;
      res.json({ price });
    } catch (error) {
      res.status(500).json({ error: "Gate.io API error", details: error.message });
    }
  });
});
