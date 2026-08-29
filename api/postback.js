export default async function handler(req, res) {
    const { sub_id, user_id, amount, secret } = req.query;
    const targetUser = sub_id || user_id;

    const MY_SECRET_KEY = "54a7062b19079f327ba82ddc79fefdf3";

    // Secret Key Verification
    if (!secret || secret !== MY_SECRET_KEY) {
        return res.status(403).send("0");
    }

    if (!targetUser || !amount) {
        return res.status(400).send("0");
    }

    const coinsToAdd = parseInt(amount, 10);
    if (isNaN(coinsToAdd) || coinsToAdd <= 0) {
        return res.status(400).send("0");
    }

    try {
        const FIREBASE_DB_URL = "https://stz-exchange-default-rtdb.firebaseio.com";
        
        // Fetch current coins
        const getUserRes = await fetch(`${FIREBASE_DB_URL}/users/${targetUser}/coins.json`);
        const currentCoins = (await getUserRes.json()) || 0;

        // Update with new coins
        const updatedCoins = currentCoins + coinsToAdd;
        await fetch(`${FIREBASE_DB_URL}/users/${targetUser}/coins.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCoins)
        });

        return res.status(200).send("1");
    } catch (error) {
        return res.status(500).send("0");
    }
}
