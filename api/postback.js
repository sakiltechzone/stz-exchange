export default async function handler(req, res) {
    const query = req.query || {};
    const body = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
    const data = { ...query, ...body };

    // ইউজার আইডি
    const subId = data.subId || data.sub_id || data.user_id || data.userId || data.uid;

    // 🌟 রিওয়ার্ড/কয়েনকে অগ্রাধিকার দেওয়া (Payout এর ডলার ভ্যালু নয়) 🌟
    let rawReward = data.reward || data.amount || data.coins;
    
    // যদি reward না পেয়ে শুধু payout পায় এবং সেটা ১ এর কম হয়, তবে তাকে কয়েনে কনভার্ট করা
    if (!rawReward && data.payout) {
        rawReward = parseFloat(data.payout) >= 1 ? data.payout : parseFloat(data.payout) * 10000;
    }

    const coinsToAdd = parseFloat(rawReward);

    if (!subId || isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(200).send("1");
    }

    const FIREBASE_SECRET = "NkYTX3Z0euDlcir7QCSLMHvE0THv6H6IseICcP5U";
    const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";

    try {
        // ১. বর্তমান কয়েন রিড করা
        const getRes = await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`);
        const currentCoins = (await getRes.json()) || 0;

        // ২. সঠিক কয়েন যোগ করা
        const updatedCoins = Math.round(Number(currentCoins) + coinsToAdd);

        // ৩. ফায়ারবেসে ব্যালেন্স সেভ করা
        await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json?auth=${FIREBASE_SECRET}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCoins)
        });

        return res.status(200).send("1");
    } catch (error) {
        return res.status(200).send("1");
    }
}
