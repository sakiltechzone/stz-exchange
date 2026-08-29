export default async function handler(req, res) {
    let data = {};

    // 🌟 GET, JSON POST এবং Form POST সব ফরম্যাট হ্যান্ডল করা 🌟
    if (req.method === 'GET') {
        data = req.query || {};
    } else {
        if (typeof req.body === 'string') {
            try {
                // JSON অথবা URL-encoded বডি পার্স করা
                data = JSON.parse(req.body);
            } catch (e) {
                const parsed = new URLSearchParams(req.body);
                data = Object.fromEntries(parsed.entries());
            }
        } else if (typeof req.body === 'object' && req.body !== null) {
            data = req.body;
        }
    }

    // ডকুমেন্টেশন অনুযায়ী প্যারামিটার ধরা
    const subId = data.subId || data.sub_id || data.user_id || req.query.subId;
    const rawReward = data.reward || data.amount || data.coins || req.query.reward;
    const coinsToAdd = parseFloat(rawReward);

    if (!subId || isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(200).send("1");
    }

    const FIREBASE_SECRET = "NkYTX3Z0euDlcir7QCSLMHvE0THv6H6IseICcP5U";
    const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";

    try {
        // ১. ফায়ারবেস থেকে আগের কয়েন আনা
        const getRes = await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`);
        const currentData = await getRes.json();
        const currentCoins = typeof currentData === 'number' ? currentData : 0;

        // ২. নতুন কয়েন যোগ করা
        const newBalance = Math.round(currentCoins + coinsToAdd);

        // ৩. ফায়ারবেসে কয়েন আপডেট করা
        await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBalance)
        });

        return res.status(200).send("1");
    } catch (err) {
        return res.status(200).send("1");
    }
}
