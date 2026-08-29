// কাঁচা বডি পড়ার ফাংশন
async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

// Multipart Form-Data পার্স করার ফাংশন
function parseMultipartData(raw) {
    const result = {};
    if (!raw || typeof raw !== 'string') return result;

    const regex = /name="([^"]+)"[\r\n]+([\s\S]*?)(?=--|\r?\n---)/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
        const key = match[1].trim();
        const value = match[2].trim();
        result[key] = value;
    }
    return result;
}

export default async function handler(req, res) {
    let data = {};

    // ১. GET কুয়েরি প্যারামিটার যুক্ত করা
    if (req.query && typeof req.query === 'object') {
        data = { ...data, ...req.query };
    }

    // ২. বডি পার্সিং (Multipart, JSON, URL-Encoded)
    try {
        let rawBody = "";
        if (typeof req.body === 'object' && req.body !== null) {
            // যদি Vercel কোনো কারণে আগেই অবজেক্ট বানিয়ে ফেলে থাকে কিন্তু কি-নামে বাউন্ডারি থাকে
            const bodyStr = JSON.stringify(req.body);
            if (bodyStr.includes('form-data; name=')) {
                data = { ...data, ...parseMultipartData(bodyStr) };
            } else {
                data = { ...data, ...req.body };
            }
        } else if (typeof req.body === 'string' && req.body.length > 0) {
            rawBody = req.body;
        } else {
            rawBody = await getRawBody(req);
        }

        if (rawBody) {
            if (rawBody.includes('form-data; name=')) {
                data = { ...data, ...parseMultipartData(rawBody) };
            } else {
                try {
                    data = { ...data, ...JSON.parse(rawBody) };
                } catch (e) {
                    const parsedUrl = new URLSearchParams(rawBody);
                    for (const [key, value] of parsedUrl.entries()) {
                        data[key] = value;
                    }
                }
            }
        }
    } catch (e) {}

    // ৩. SubID বের করা
    const subId = data.subId || data.sub_id || data.user_id || data.userId || data.uid || (req.query && req.query.subId);

    // ৪. কয়েন বা পেআউট বের করা
    let rawAmount = data.reward || data.amount || data.payout || data.coins || (req.query && (req.query.reward || req.query.payout));
    let coinsToAdd = parseFloat(rawAmount);

    // যদি পেআউট ডলার হিসেবে আসে
    if (!isNaN(coinsToAdd) && coinsToAdd > 0 && coinsToAdd < 1 && !data.reward) {
        coinsToAdd = Math.round(coinsToAdd * 20000);
    } else if (!isNaN(coinsToAdd)) {
        coinsToAdd = Math.round(coinsToAdd);
    }

    if (!subId || isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(200).send("1");
    }

    const FIREBASE_SECRET = "NkYTX3Z0euDlcir7QCSLMHvE0THv6H6IseICcP5U";
    const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";

    try {
        // ফায়ারবেস থেকে আগের কয়েন রিড করা
        const getUrl = `${FIREBASE_DB_URL}/users/${encodeURIComponent(subId)}/coins.json?auth=${FIREBASE_SECRET}`;
        const getRes = await fetch(getUrl);
        const currentData = await getRes.json();
        const currentCoins = (typeof currentData === 'number') ? currentData : 0;

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
