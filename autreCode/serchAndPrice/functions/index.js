//const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

admin.initializeApp();

exports.proxyRequest = onRequest(
    { region: "europe-west1" },
    async (req, res) => {

        // تعيين رؤوس CORS
        const origin = req.headers.origin;
        const allowedOrigins = [//APPS_SCRIPT_WEB_APP_URL,
        //"https://site2.com",
        "http://127.0.0.1:4808",
        ];

        if (allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
        } else {
        return res.status(403).send("Forbidden");
        }
        res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        // تعيين رؤوس CORS end

        const tabelAlert = req.method === "POST" ? req.body.datas : req.query.datas;
        try {
            
            if (!tabelAlert) {
                res.send("rah  " + tabelAlert);
                return null;
            }
            let repond;
            const querySmbl = req.method === "POST" ? req.body.querySmble : req.query.querySmble;
            if (tabelAlert == "smbls") {
                repond = await srchSmbls(querySmbl);
               // return null;
            } else if (tabelAlert == "price") {
              repond= await price(querySmbl);
            }
            const stRpnd = JSON.stringify(repond);
            res.status(200).json(stRpnd);

           return null;
        } catch (error) {
            return res.status(500).json({
                error: "Failed to fetch data 0",
                details: error.message,
            });
        }
    }   


);

/* 
/////////////////////////
///////////////////////////
/////////////////////////////
    nta3 query1.finance.yahoo.com
*/

async function srchSmbls(querySmble) {
    const apiUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${querySmble}`;
    let responseFnl = [];

    try {
        let rslt = (await axios.get(apiUrl)).data.quotes;
        for (const quote of rslt) {
            const estCandle = {
                symbol: quote.symbol,
                exchDisp: quote.exchDisp,
                shortname: quote.shortname,
                quoteType: quote.quoteType,
            };
            responseFnl.push(estCandle);
        }

    } catch (error) {
        logger.error("Axios error:", error.message);
        return {
            error: "Failed to fetch data1",
            details: error.message,
        };
    }

    return responseFnl;

}

//get pice of symbole
async function price(smbl) {
    const urlPrice =`https://query1.finance.yahoo.com/v8/finance/chart/${smbl}?interval=5m&range=10m`;

    try {
        const response = await axios.get(urlPrice);
        const result = response.data.chart.result[0];

        if (!result || result.length === 0) {
             return { error: "Symbol not found", smbl };
        }

        const meta = result.meta;
        const quoteData = result.indicators.quote[0];

        if (quoteData && quoteData.close && quoteData.close.length > 0) {
            const lastPrice = quoteData.close[quoteData.close.length - 1]; 
            
            return {
              //  symbol: smbl,
                price: lastPrice,
                currency: meta.currency
            };
        } else {
            return {
                error: "No valid price data found",
                smbl
            };
        }

    } catch (error) {
        console.error("Axios error:", error.message);
        return {
            error: "Failed to fetch data 2",
            details: error.message,
        };
    }
}