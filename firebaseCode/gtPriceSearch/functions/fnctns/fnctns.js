import axios from "axios";

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
		return {
			error: "Failed to fetch data1",
			details: error.message,
		};
	}

	return responseFnl;
}

async function price(smbl) {
	const urlPrice = s =>
		`https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1h&range=1d`;
	const searchUrl = s =>
		`https://query2.finance.yahoo.com/v1/finance/search?q=${s}`;

	// إعداد الـ Headers لمحاكاة متصفح حقيقي وتجنب الـ 404 أو المنع
	const config = {
		headers: { "User-Agent": "Mozilla/5.0" },
	};

	try {
		let response;
		let result;

		try {
			// المحاولة الأولى: الرمز الأصلي
			response = await axios.get(urlPrice(smbl), config);
			result = response.data?.chart?.result?.[0];
		} catch (e) {
			// إذا أعطى 404، نترك result فارغة لننتقل للبحث
			result = null;
		}

		// إذا لم يجد الرمز أو حدث خطأ، نبحث عن اقتراحات
		if (!result) {
			console.log(`🔍 جاري البحث عن بديل لـ: ${smbl}`);
			const searchRes = await axios.get(searchUrl(smbl), config);
			const bestMatch = searchRes.data?.quotes?.[0]?.symbol;

			if (bestMatch) {
				console.log(`✅ وجدنا رمزاً مطابقاً: ${bestMatch}`);
				response = await axios.get(urlPrice(bestMatch), config);
				result = response.data?.chart?.result?.[0];
			}
		}

		if (!result) return { error: "Symbol not found", smbl };

		const q = result.indicators?.quote?.[0];
		const meta = result.meta;

		// استخراج السعر بذكاء
		let lastClose = null;
		if (q?.close) {
			for (let i = q.close.length - 1; i >= 0; i--) {
				if (q.close[i] !== null && q.close[i] !== undefined) {
					lastClose = q.close[i];
					break;
				}
			}
		}
		return {
			symbol: meta.symbol,
			close: lastClose || meta.regularMarketPrice,
			currency: meta.currency,
			name: meta.longName || meta.shortName,
		};
	} catch (error) {
		return {
			error: "Failed to fetch data",
			details: error.response?.data?.chart?.error?.description || error.message,
		};
	}
}

export {  price ,srchSmbls };
