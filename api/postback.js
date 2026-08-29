export default async function handler(req, res) {
    // GET ও POST উভয় রিকোয়েস্ট থেকে ডাটা গ্রহণ
    const data = { ...req.query, ...req.body };

    const subId = data.subId || data.sub_id || data.user_id || data.userId;
    const reward = data.reward || data.amount || data.payout;

    if (!subId || !reward) {
        return res.status(400).send("0");
    }

    const coinsToAdd = parseFloat(reward);
    if (isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(400).send("0");
    }

    // 🌟 ফায়ারবেস Database Secret কি ও REST URL 🌟
    const FIREBASE_SECRET = "NkYTX3Z0euDlcir7QCSLMHvE0THv6H6IseICcP5U";
    const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";

    try {
        // ১. অ্যাডমিন পারমিশন সহ বর্তমান ব্যালেন্স রিড করা
        const getRes = await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`);
        const currentCoins = (await getRes.json()) || 0;

        // ২. নতুন ব্যালেন্স হিসাব করা
        const updatedCoins = Math.round(currentCoins + coinsToAdd);

        // ৩. অ্যাডমিন পারমিশন সহ নতুন ব্যালেন্স সেভ করা
        const putRes = await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCoins)
        });

        if (putRes.ok) {
            return res.status(200).send("1");
        } else {
            return res.status(500).send("0");
        }
    } catch (error) {
        return res.status(500).send("0");
    }
}
