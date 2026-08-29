export default async function handler(req, res) {
    let data = {};

    // ১. GET, JSON বডি এবং Form-data বডি সব পার্স করা
    if (req.method === 'GET') {
        data = req.query || {};
    } else {
        if (typeof req.body === 'string') {
            try {
                data = JSON.parse(req.body);
            } catch (e) {
                const parsed = new URLSearchParams(req.body);
                data = Object.fromEntries(parsed.entries());
            }
        } else if (typeof req.body === 'object' && req.body !== null) {
            data = req.body;
        }
    }

    // ২. SubID বের করা (Query ও Body উভয় থেকেই)
    const subId = data.subId || data.sub_id || data.user_id || data.userId || data.uid || req.query.subId || req.query.uid;

    // ৩. রিওয়ার্ড/পেআউট প্যারামিটার হ্যান্ডলিং
    let rawVal = data.reward || data.amount || data.payout || data.coins || req.query.reward || req.query.payout;
    let coinsToAdd = parseFloat(rawVal);

    // যদি পেআউট সরাসরি ছোট ডলার সংখ্যা হয় (যেমন: 0.002 বা 1 এর নিচে), তবে ২০,০০০ এক্সচেঞ্জ রেটে কয়েনে রূপান্তর
    if (!isNaN(coinsToAdd) && coinsToAdd > 0 && coinsToAdd < 1 && !data.reward) {
        coinsToAdd = Math.round(coinsToAdd * 20000);
    }

    if (!subId || isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(200).send("1");
    }

    const FIREBASE_SECRET = "NkYTX3Z0euDlcir7QCSLMHvE0THv6H6IseICcP5U";
    const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";

    try {
        // ফায়ারবেস থেকে আগের ব্যালেন্স রিড করা
        const getRes = await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`);
        const currentData = await getRes.json();
        const currentCoins = typeof currentData === 'number' ? currentData : 0;

        // নতুন কয়েন যোগ
        const newBalance = Math.round(currentCoins + coinsToAdd);

        // ফায়ারবেসে রাইট করা
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
