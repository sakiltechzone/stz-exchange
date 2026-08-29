export default async function handler(req, res) {
    // POST বডি অথবা GET কুয়েরি থেকে প্যারামিটার গ্রহণ
    const data = req.method === 'POST' ? req.body : req.query;
    
    const subId = data.subId || data.sub_id || data.user_id;
    const reward = data.reward || data.amount;
    const secret = data.secret || req.query.secret;

    const MY_SECRET_KEY = "54a7062b19079f327ba82ddc79fefdf3";

    // Secret Key চেক (যদি পাঠানো হয়)
    if (secret && secret !== MY_SECRET_KEY) {
        return res.status(403).send("0");
    }

    if (!subId || !reward) {
        return res.status(400).send("0");
    }

    const coinsToAdd = parseInt(reward, 10);
    if (isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(400).send("0");
    }

    try {
        const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";
        
        // বর্তমান কয়েন রিড করা
        const getUserRes = await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json`);
        const currentCoins = (await getUserRes.json()) || 0;

        // ব্যালেন্স আপডেট করা
        const updatedCoins = currentCoins + coinsToAdd;
        await fetch(`${FIREBASE_DB_URL}/users/${subId}/coins.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCoins)
        });

        // সফল রেসপন্স
        return res.status(200).send("1");
    } catch (error) {
        return res.status(500).send("0");
    }
}
