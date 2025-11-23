//const functions = require("firebase-functions");
import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import axios from "axios";



/* const { onValueCreated } = require("firebase-functions/v2/database");

exports.onUserAdded = onValueCreated("/users/{userId}", (event) => {
  const data = event.data.val(); // البيانات الجديدة
  logger.log("New user added:", data);

  // هنا ضع ما تريده أن يحدث عند الإضافة
});


 */
// ⭐ يجب أن يتم قبل استيراد أي ملف يستخدم الـ Admin SDK
initializeApp();




export const proxyRequestV2 = onRequest(
	{ region: "europe-west1" },
	async (req, res) => {
		// تعيين رؤوس CORS
		const origin = req.headers.origin;
		const allowedOrigins = [
			"https://pricealerts.github.io/",
			"https://hostsite-80e14.web.app/",
			"https://pricealerts.web.app/",
			"http://127.0.0.1:4808",
		];
		if (allowedOrigins.includes(origin)) {
			res.set("Access-Control-Allow-Origin", origin);
		} else if (origin === undefined && req.body.orgn === "appsScriptDadi") {
			res.set("Access-Control-Allow-Origin", "*");
		} else {
			return res.status(403).send("Forbidden" + origin);
		}
		res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		res.set("Access-Control-Allow-Headers", "Content-Type");


		const tabelAlert = req.method === "POST" ? req.body.datas : req.query.datas;
		try {
			
			if (!tabelAlert) {
				res.send("rah khawi " + tabelAlert);
				return null;
			}
			let repond;
			const querySmbl =
				req.method === "POST" ? req.body.querySmble : req.query.querySmble;
			if (tabelAlert == "smbls") {
				repond = await srchSmbls(querySmbl);
			} else if (tabelAlert == "price") {
				repond = await price(querySmbl);
			}else if (tabelAlert == 'stocksExchange') {
				repond = await gtStocks(querySmbl)
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
	
	const urlPrice = `https://query1.finance.yahoo.com/v8/finance/chart/${smbl}?interval=1h&range=1d`;
	let responsePost = {};
	try {
		const response = await axios.get(urlPrice);
		const data = response.data;
		const result = data.chart.result && data.chart.result[0];

		if (!result || result.length === 0) {
			return { error: "Symbol not found", smbl };
		}

		const timestamps = result.timestamp;
		const q = result.indicators?.quote?.[0];
		const meta = result.meta;

		// ✅ الحالة 1: بيانات شموع حقيقية متوفرة
		if (timestamps && q && q.close && q.close.length > 0) {
			const i = q.close.length - 1;
			 responsePost = {
				close: q.close[i],
				currency: meta.currency,
			};
		}else if (meta && meta.regularMarketPrice) {
      // ✅ الحالة 2: لا توجد بيانات شموع → نُنشئ شمعة تقديرية من meta
			 responsePost = {
				close: meta.regularMarketPrice,
				currency: meta.currency,
			};
    
		} else {
			responsePost = {	error: "No valid price data found", smbl,	};
		}
			return responsePost;
	} catch (error) {
		console.error("Axios error:", error.message);
		return {
			error: "Failed to fetch data 2",
			details: error.message,
		};
	}
}




async function gtStocks(stck) {
  try {
    const url = stck === "nasdaq" ? "https://datahub.io/core/nasdaq-listings/r/nasdaq-listed.csv": "https://datahub.io/core/nyse-other-listings/r/nyse-listed.csv";
	

    let symbols = [];

    
      try {
        const response = await axios.get(url);
        const csv = response.data;

        // تحويل CSV إلى مصفوفة
        const rows = csv.split("\n").map(r => r.split(","));

        // تجاوز الصف الأول (الرؤوس)
         symbols = rows.slice(1).map(r => r[0]).filter(Boolean);

       

      } catch (err) {
        console.log(`❌ خطأ في جلب ${url}: ${err.message}`);
      }

    

    return symbols

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};




/* 
 await admin.database().ref("stocks").set({
      allStocks,
      allStocks2Ary
    });
*/

function tttt(params) {
	//let data = JSON.parse(e.postData.contents);
	// الطلب قادم من الواجهة الأمامية (تعيين/حذف التنبيه)
	let smbl = "AAPL";
	let responsePost = {};

	try {
		const url = `https://query1.finance.yahoo.com/v8/finance/chart/${smbl}?interval=1h&range=1d`;
		const response = UrlFetchApp.fetch(url);
		const data = JSON.parse(response.getContentText());
		const result = data.chart.result && data.chart.result[0];

		if (!result) {
			responsePost = "❌ لا توجد بيانات في chart.result";
			return ContentService.createTextOutput(JSON.stringify(responsePost));
		}

		const timestamps = result.timestamp;
		const q = result.indicators?.quote?.[0];
		const meta = result.meta;

		// ✅ الحالة 1: بيانات شموع حقيقية متوفرة
		if (timestamps && q && q.close && q.close.length > 0) {
			const i = q.close.length - 1;
			const candle = {
				symbol: meta.symbol,
				time: new Date(timestamps[i] * 1000),
				open: q.open[i],
				high: q.high[i],
				low: q.low[i],
				close: q.close[i],
				volume: q.volume ? q.volume[i] : null,
				exchange: meta.fullExchangeName,
				currency: meta.currency,
				type: "real",
			};

			responsePost = `${candle.close}  fi timestamps`;
		}

		// ✅ الحالة 2: لا توجد بيانات شموع → نُنشئ شمعة تقديرية من meta
		if (meta && meta.regularMarketPrice) {
			const estCandle = {
				symbol: meta.symbol,
				time: new Date(meta.regularMarketTime * 1000),
				open: meta.previousClose,
				high: meta.regularMarketDayHigh,
				low: meta.regularMarketDayLow,
				close: meta.regularMarketPrice,
				volume: meta.regularMarketVolume,
				exchange: meta.fullExchangeName,
				currency: meta.currency,
				type: "estimated",
			};

			responsePost = `${estCandle.close} w ${estCandle.currency}  fi meta`;
		}
	} catch (error) {
		responsePost = error;
	}

	console.log(responsePost);
	// return ContentService.createTextOutput(JSON.stringify(responsePost))
}
