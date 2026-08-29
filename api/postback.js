export default async function handler(req, res) {
    let data = {};

    // কুয়েরি প্যারামিটার যুক্ত করা
    if (req.query && typeof req.query === 'object') {
        data = { ...req.query };
    }

    // বডি পার্সিং (JSON, Form-Data, Text)
    if (req.body) {
        if (typeof req.body === 'object') {
            data = { ...data, ...req.body };
        } else if (typeof req.body === 'string') {
            try {
                const parsedJson = JSON.parse(req.body);
                data = { ...data, ...parsedJson };
            } catch (e) {
                try {
                    const parsedUrl = new URLSearchParams(req.body);
                    for (const [key, value] of parsedUrl.entries()) {
                        data[key] = value;
                    }
                } catch (err) {}
            }
        }
    }

    // SubID নির্ধারণ
    const subId = data.subId || data.sub_id || data.user_id || data.userId || data.uid || data.subid || (req.query && req.query.subId);

    // রিওয়ার্ড / পেআউট মান নির্ধারণ
    const rawVal = data.reward || data.amount || data.payout || data.coins || (req.query && (req.query.reward || req.query.payout));
    let coinsToAdd = parseFloat(rawVal);

    // ছোট ডলার ভ্যালু আসলে কয়েনে কনভার্ট করা
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
        // ১. বর্তমান কয়েন রিড করা
        const getUrl = `${FIREBASE_DB_URL}/users/${encodeURIComponent(subId)}/coins.json?auth=${FIREBASE_SECRET}`;
        const getRes = await fetch(getUrl);
        const currentData = await getRes.json();
        const currentCoins = (typeof currentData === 'number') ? currentData : 0;

        // ২. নতুন কয়েন হিসাব
        const newBalance = currentCoins + coinsToAdd;

        // ৩. ফায়ারবেসে সেভ করা
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
