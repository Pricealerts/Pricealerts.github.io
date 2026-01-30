const LATEST_CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36";

function respnsCode(e){
  try {
    let finalResults = {};
    // استقبال البيانات (مصفوفة الرموز)
    const requestData = JSON.parse(e.postData.contents);
    if(requestData.action == "price"){
      const smbl = requestData.smbl; // نتوقع ["BTC-USD", "AAPL"]
      
      // معالجة كل رمز باستخدام الدالة الموجودة في الملف الآخر
      
        finalResults = getYahooPrice(smbl);
      
    }else if("smbls"){
      const querySmble = requestData.querySmble;
      finalResults = srchSmbls(querySmble) 
    }
    
    return finalResults

  } catch (err) {
    return { error: err.message }
  }
}


/**
 * جلب بيانات السعر من Yahoo Finance مع خاصية البحث التلقائي عن الرمز البديل
 */
function getYahooPrice(smbl) {
  const urlPrice = (s) => `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?interval=1h&range=1d`;
  const searchUrl = (s) => `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(s)}`;

  const options = {
    //"method": "get",
    "headers": { "User-Agent": LATEST_CHROME_UA},
    "muteHttpExceptions": true // للسماح بمعالجة أخطاء 404 برمجياً
  };

  try {
    let response = UrlFetchApp.fetch(urlPrice(smbl), options);
    let content = JSON.parse(response.getContentText());
    let result = content.chart?.result?.[0];

    // إذا لم يجد الرمز (خطأ 404 أو نتيجة فارغة)، نبحث عن اقتراحات
    if (!result || response.getResponseCode() !== 200) {
      let searchRes = UrlFetchApp.fetch(searchUrl(smbl), options);
      let searchData = JSON.parse(searchRes.getContentText());
      let bestMatch = searchData.quotes?.[0]?.symbol;

      if (bestMatch) {
        response = UrlFetchApp.fetch(urlPrice(bestMatch), options);
        content = JSON.parse(response.getContentText());
        result = content.chart?.result?.[0];
      }
    }

    if (!result) return { error: "Symbol not found", smbl: smbl };

    const q = result.indicators?.quote?.[0];
    const meta = result.meta;

    // استخراج السعر الأخير (Close Price)
    let lastClose = null;
    if (q?.close && Array.isArray(q.close)) {
      for (let i = q.close.length - 1; i >= 0; i--) {
        if (q.close[i] !== null && q.close[i] !== undefined) {
          lastClose = q.close[i];
          break;
        }
      }
    }
    return {
      symbol: meta.symbol,
      price: lastClose || meta.regularMarketPrice,
      currency: meta.currency,
     // name: meta.longName || meta.shortName,
     // timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      error: "Failed to fetch data",
      details: error.toString()
    };
  }
}






/**
 * البحث عن رموز الأسهم والعملات في Yahoo Finance
 * @param {string} querySmble - الكلمة المراد البحث عنها (مثلاً: "BTC" أو "AAPL")
 * @return {Array|Object} - مصفوفة بالنتائج أو كائن يحتوي على الخطأ
 */
function srchSmbls(querySmble) {
  const apiUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(querySmble)}`;
  let responseFnl = [];

  try {
    // إعداد طلب الـ Fetch مع ترويسة User-Agent لتجنب المنع
    const options = {
      "headers": {
        "User-Agent": LATEST_CHROME_UA
      },
      "muteHttpExceptions": true
    };

    const response = UrlFetchApp.fetch(apiUrl, options);
    
    // التأكد من نجاح الطلب
    if (response.getResponseCode() !== 200) {
      throw new Error("HTTP Error: " + response.getResponseCode());
    }

    const data = JSON.parse(response.getContentText());
    const rslt = data.quotes || [];

    // معالجة البيانات وتحويلها للشكل المطلوب
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
    return {
      error: "Failed to fetch data1",
      details: error.toString(),
    };
  }

  return responseFnl;
}




function fetchAllPrices(tickers) {
  // 1. تحويل مصفوفة الرموز إلى مصفوفة طلبات (Requests)
  const requests = tickers.map(symbol => {
    return {
      url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1h&range=1d`,
      method: "get",
      headers: { "User-Agent": LATEST_CHROME_UA },
      muteHttpExceptions: true
    };
  });

  // 2. استخدام fetchAll (هذا هو البديل الحقيقي لـ Promise.all)
  // جوجل سينفذ جميع هذه الطلبات في وقت واحد تقريباً
  const responses = UrlFetchApp.fetchAll(requests);

  // 3. معالجة النتائج
  const results = responses.map((res, index) => {
    if (res.getResponseCode() === 200) {
      const content = JSON.parse(res.getContentText());
      return { symbol: tickers[index], data: content.chart.result[0] };
    }
    return { symbol: tickers[index], error: "Failed" };
  });

  return results;
}