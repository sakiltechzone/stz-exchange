// কাঁচা বডি রিড করার হেল্পার
async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
    let data = {};

    // ১. GET কোয়েরি থাকলে নেওয়া
    if (req.query && typeof req.query === 'object') {
        data = { ...data, ...req.query };
    }

    // ২. POST বডি পার্সিং (Vercel-এর কাঁচা রিকোয়েস্ট থেকে সরাসরি পড়া)
    try {
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
    } catch (e) {}

    // ৩. SubID বের করা
    const subId = data.subId || data.sub_id || data.user_id || data.userId || data.uid || data.subid || (req.query && req.query.subId);

    // ৪. কয়েন বা পেআউট বের করা
    let rawAmount = data.reward || data.amount || data.payout || data.coins || (req.query && (req.query.reward || req.query.payout || req.query.amount));
    let coinsToAdd = parseFloat(rawAmount);

    // যদি ডলার হিসেবে আসে (যেমন 0.002 বা 1-এর কম) তবে কয়েনে রূপান্তর
    if (!isNaN(coinsToAdd) && coinsToAdd > 0 && coinsToAdd < 1 && !data.reward) {
        coinsToAdd = Math.round(coinsToAdd * 20000);
    } else if (!isNaN(coinsToAdd)) {
        coinsToAdd = Math.round(coinsToAdd);
    }

    // যদি ডেটা পুরোপুরি খালি থাকে
    if (!subId || isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(200).send("1");
    }

    const FIREBASE_SECRET = "NkYTX3Z0euDlcir7QCSLMHvE0THv6H6IseICcP5U";
    const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";

    try {
        // ফায়ারবেস থেকে আগের ব্যালেন্স রিড করা
        const getUrl = `${FIREBASE_DB_URL}/users/${encodeURIComponent(subId)}/coins.json?auth=${FIREBASE_SECRET}`;
        const getRes = await fetch(getUrl);
        const currentData = await getRes.json();
        const currentCoins = typeof currentData === 'number' ? currentData : 0;

        // নতুন ব্যালেন্স
        const newBalance = currentCoins + coinsToAdd;

        // ফায়ারবেসে সেভ করা
        const putUrl = `${FIREBASE_DB_URL}/users/${encodeURIComponent(subId)}/coins.json?auth=${FIREBASE_SECRET}`;
        await fetch(putUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBalance)
        });

        return res.status(200).send("1");
    } catch (err) {
        return res.status(200).send("1");
    }
}
