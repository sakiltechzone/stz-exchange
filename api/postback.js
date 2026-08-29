export default async function handler(req, res) {
    const query = req.query || {};
    const body = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
    const data = { ...query, ...body };

    // ১. যেকোনো প্যারামিটার থেকে SubID বের করা
    const subId = data.subId || data.sub_id || data.user_id || data.userId || data.uid || data.subid || data.custom;

    // ২. রিওয়ার্ড বা পেআউট কনভার্ট করা
    let coinsToAdd = 0;
    if (data.reward && !isNaN(parseFloat(data.reward)) && parseFloat(data.reward) > 0) {
        coinsToAdd = parseFloat(data.reward);
    } else if (data.amount && !isNaN(parseFloat(data.amount)) && parseFloat(data.amount) > 0) {
        coinsToAdd = parseFloat(data.amount);
    } else if (data.coins && !isNaN(parseFloat(data.coins)) && parseFloat(data.coins) > 0) {
        coinsToAdd = parseFloat(data.coins);
    } else if (data.payout && !isNaN(parseFloat(data.payout))) {
        const p = parseFloat(data.payout);
        coinsToAdd = p >= 1 ? p : Math.round(p * 20000);
    }

    if (!subId || isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(200).send("1");
    }

    const FIREBASE_SECRET = "NkYTX3Z0euDlcir7QCSLMHvE0THv6H6IseICcP5U";
    const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";

    try {
        // ফায়ারবেস থেকে বর্তমান ব্যালেন্স নেওয়া
        const getRes = await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`);
        const currentData = await getRes.json();
        const currentCoins = typeof currentData === 'number' ? currentData : 0;

        // নতুন ব্যালেন্স হিসাব
        const newBalance = Math.round(currentCoins + coinsToAdd);

        // ফায়ারবেসে ব্যালেন্স সেভ করা
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
