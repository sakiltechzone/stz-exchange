export default async function handler(req, res) {
    // POST বা GET রিকোয়েস্ট থেকে ডাটা গ্রহণ
    const data = req.method === 'POST' ? req.body : req.query;

    const subId = data.subId || data.sub_id || data.user_id || data.userId;
    const reward = data.reward || data.amount || data.payout;
    const secret = data.secret || req.query.secret;

    const MY_SECRET_KEY = "54a7062b19079f327ba02ddc79fefdf3";

    // Secret Key চেক (যদি OfferwallMedia পাঠায়)
    if (secret && secret !== MY_SECRET_KEY) {
        return res.status(403).send("0");
    }

    if (!subId || !reward) {
        return res.status(400).send("0");
    }

    const coinsToAdd = parseFloat(reward);
    if (isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(400).send("0");
    }

    try {
        // সঠিক Firebase Realtime Database REST API URL
        const FIREBASE_DB_URL = "https://stz-exchange.firebaseio.com";

        // ১. ইউজারের বর্তমান কয়েন ফেচ করা
        const getUserRes = await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json`);
        const currentCoins = (await getUserRes.json()) || 0;

        // ২. কয়েন যোগ করে নতুন ব্যালেন্স তৈরি
        const updatedCoins = Math.round(currentCoins + coinsToAdd);

        // ৩. ফায়ারবেসে কয়েন সেভ করা
        await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCoins)
        });

        // ৪. OfferwallMedia-কে সফল রেসপন্স পাঠানো
        return res.status(200).send("1");
    } catch (error) {
        return res.status(500).send("0");
    }
}
