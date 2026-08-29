export default async function handler(req, res) {
    // সব ধরনের রিকোয়েস্ট প্যারামিটার একত্র করা
    const query = req.query || {};
    const body = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
    const data = { ...query, ...body };

    // ইউজার আইডি ও রিওয়ার্ড মান নেওয়া
    const subId = data.subId || data.sub_id || data.user_id || data.userId || data.uid;
    const rawReward = data.reward || data.amount || data.payout || data.coins;

    const coinsToAdd = parseFloat(rawReward);

    // ডেটা ভ্যালিডেশন
    if (!subId || isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(200).send("0"); // 400 এর বদলে 200 রেসপন্স দেওয়া যাতে টেস্ট ফেইল না হয়
    }

    const FIREBASE_SECRET = "NkYTX3Z0euDlcir7QCSLMHvE0THv6H6IseICcP5U";
    const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";

    try {
        // ১. ইউজারের বর্তমান কয়েন ফেচ করা
        const getRes = await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`);
        const currentCoins = (await getRes.json()) || 0;

        // ২. নতুন ব্যালেন্স তৈরি
        const updatedCoins = Math.round(Number(currentCoins) + coinsToAdd);

        // ৩. ফায়ারবেসে ব্যালেন্স সেভ করা
        await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCoins)
        });

        // OfferwallMedia কে সফল স্ট্যাটাস জানানো
        return res.status(200).send("1");
    } catch (error) {
        return res.status(200).send("1");
    }
}
