async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
    let data = {};
    let debugLog = {};

    try {
        if (req.query && typeof req.query === 'object') {
            data = { ...data, ...req.query };
        }

        let rawBody = "";
        if (typeof req.body === 'object' && req.body !== null) {
            data = { ...data, ...req.body };
        } else if (typeof req.body === 'string' && req.body.length > 0) {
            rawBody = req.body;
        } else {
            rawBody = await getRawBody(req);
        }

        if (rawBody) {
            try {
                const parsedJson = JSON.parse(rawBody);
                data = { ...data, ...parsedJson };
            } catch (e) {
                const searchParams = new URLSearchParams(rawBody);
                for (const [key, value] of searchParams.entries()) {
                    data[key] = value;
                }
            }
        }

        debugLog.received_data = data;

        const subId = data.subId || data.sub_id || data.user_id || data.userId || data.uid || data.subid || (req.query && req.query.subId);
        debugLog.extracted_subId = subId;

        let rawAmount = data.reward || data.amount || data.payout || data.coins || (req.query && (req.query.reward || req.query.payout || req.query.amount));
        let coinsToAdd = parseFloat(rawAmount);

        if (!isNaN(coinsToAdd) && coinsToAdd > 0 && coinsToAdd < 1 && !data.reward) {
            coinsToAdd = Math.round(coinsToAdd * 20000);
        } else if (!isNaN(coinsToAdd)) {
            coinsToAdd = Math.round(coinsToAdd);
        }
        debugLog.parsed_coins = coinsToAdd;

        if (!subId || isNaN(coinsToAdd) || coinsToAdd <= 0) {
            return res.status(200).json({ status: "fail", message: "Invalid SubID or Coins", debug: debugLog });
        }

        const FIREBASE_SECRET = "NkYTX3Z0euDlcir7QCSLMHvE0THv6H6IseICcP5U";
        const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";

        // ১. ফায়ারবেস থেকে ডেটা রিড করার চেষ্টা
        const getUrl = `${FIREBASE_DB_URL}/users/${encodeURIComponent(subId)}/coins.json?auth=${FIREBASE_SECRET}`;
        const getRes = await fetch(getUrl);
        const getResText = await getRes.text();
        debugLog.firebase_get_response = getResText;

        let currentCoins = 0;
        try {
            const parsedGet = JSON.parse(getResText);
            if (typeof parsedGet === 'number') currentCoins = parsedGet;
        } catch(e) {}

        const newBalance = currentCoins + coinsToAdd;
        debugLog.calculated_new_balance = newBalance;

        // ২. ফায়ারবেসে ডেটা রাইট করার চেষ্টা
        const putUrl = `${FIREBASE_DB_URL}/users/${encodeURIComponent(subId)}/coins.json?auth=${FIREBASE_SECRET}`;
        const putRes = await fetch(putUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBalance)
        });
        const putResText = await putRes.text();
        debugLog.firebase_put_response = putResText;

        return res.status(200).json({ status: "success", debug: debugLog });

    } catch (err) {
        return res.status(200).json({ status: "error", error_message: err.message, debug: debugLog });
    }
}
