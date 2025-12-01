import axios from "axios";
import AdmZip from "adm-zip";  // تحتاج npm i adm-zip

async function getXetraSymbols() {
  const url = "https://www.deutsche-boerse-cash-market.com/resource/blob/2342664/9c9967431b5f8aef6fafd08a30a153f0/data/CFI_XETRA_CSV.zip";

  const res = await axios.get(url, { responseType: "arraybuffer" });
  const zip = new AdmZip(res.data);

  const csvFile = zip.getEntries()[0]; 
  const csvText = csvFile.getData().toString("utf8");

  const lines = csvText.split("\n");
  const symbols = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const symbol = cols[0];
    if (symbol) symbols.push(symbol + ".DE"); // Yahoo Finance format
  }

  return symbols;
}

getXetraSymbols().then(console.log);


import axios from "axios";

export async function getTseSymbols() {
  const url =
    "https://raw.githubusercontent.com/datasets/japan-stock-prices/master/data/stock-list.csv";

  try {
    const res = await axios.get(url);
    const csv = res.data;

    const lines = csv.split("\n");
    const symbols = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");

      const symbol = cols[0]; // مثل: 7203
      if (!symbol) continue;

      symbols.push(symbol.trim() + ".T"); // Yahoo Finance format
    }

    console.log("Total TSE symbols:", symbols.length);
    return symbols;
  } catch (err) {
    console.error("Error fetching TSE:", err.message);
    return [];
  }
}

const axios = require("axios");
const Papa = require("papaparse");
import Papa from "papaparse";





















const axios = require("axios");

// تحويل CSV إلى Array of Objects
function parseCSV(csvString) {
    const lines = csvString.split("\n").filter(l => l.trim() !== "");

    // استخراج أسماء الأعمدة من أول سطر
    const headers = lines[0].split(",").map(h => h.trim());

    const rows = lines.slice(1); // باقي السطور هي البيانات
    const data = [];

    for (const line of rows) {
        const values = line.split(","); // Split بسيط—قد لا يعمل مع النصوص التي تحتوي فاصلة
        if (values.length !== headers.length) continue;

        const obj = {};
        for (let i = 0; i < headers.length; i++) {
            obj[headers[i]] = values[i] ? values[i].trim() : "";
        }
        data.push(obj);
    }

    return data;
}

async function getListings(apiKey) {
    const url = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${apiKey}`;
    const response = await axios.get(url);
    return parseCSV(response.data);
}

async function getExchangeSymbols(apiKey, exchangeName) {
    const listings = await getListings(apiKey);

    return listings
        .filter(item => item.exchange === exchangeName)
        .map(item => item.symbol);
}

// مثال للاستخدام
(async () => {
    const apiKey = "YOUR_API_KEY"; // ضع المفتاح هنا

    const xetra = await getExchangeSymbols(apiKey, "XETRA");
    const tse = await getExchangeSymbols(apiKey, "TSE");

    console.log("XETRA symbols count:", xetra.length);
    console.log("TSE symbols count:", tse.length);

    console.log(xetra.slice(0,10)); // أول 10 رموز
    console.log(tse.slice(0,10));   // أول 10 رموز
})();





import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 8080;

function parseCSV(csvString) {
    const lines = csvString.split("\n").filter(l => l.trim() !== "");
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1);
    const data = [];
    for (const line of rows) {
        const values = line.split(",");
        if (values.length !== headers.length) continue;
        const obj = {};
        for (let i = 0; i < headers.length; i++) {
            obj[headers[i]] = values[i] ? values[i].trim() : "";
        }
        data.push(obj);
    }
    return data;
}

async function getListings(apiKey) {
    const url = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${apiKey}`;
    const response = await axios.get(url);
    return parseCSV(response.data);
}

async function getExchangeSymbols(apiKey, exchangeName) {
    const listings = await getListings(apiKey);
    return listings.filter(item => item.exchange === exchangeName).map(item => item.symbol);
}

// Endpoint HTTP
app.get("/", async (req, res) => {
    const apiKey = "Q8AIEW15FA4GEOWK"; // ضع المفتاح هنا
    const xetra = await getExchangeSymbols(apiKey, "XETRA");
    const tse = await getExchangeSymbols(apiKey, "TSE");

    res.json({
        xetraCount: xetra.length,
        tseCount: tse.length,
        xetraSample: xetra.slice(0,10),
        tseSample: tse.slice(0,10)
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



