const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = 3000;

const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'maidHiringSystem';

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'city.html'));
});

app.get('/results.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'results.html'));
});

app.get('/api/maids', async (req, res) => {
    const { city, serviceType } = req.query;
    console.log('Received request with query:', req.query);

    if (!city && !serviceType) {
        console.log('No filters provided');
        return res.status(400).json({ error: 'At least one filter (city or serviceType) is required' });
    }

    let client;

    try {
        client = await MongoClient.connect(mongoUrl);
        console.log('Connected to MongoDB');
        const db = client.db(dbName);
        const collection = db.collection('maids');

        let query = {};
        if (city) query.city = { $regex: new RegExp('^' + city + '$', 'i') };
        if (serviceType) query.serviceType = { $regex: new RegExp('^' + serviceType + '$', 'i') };

        console.log('Executing query:', query);

        const maids = await collection.find(query).toArray();
        console.log(`Found ${maids.length} maids for query:`, query);
        if (maids.length > 0) {
            console.log('First maid in results:', maids[0]);
        } else {
            console.log('No maids found for the given criteria');
        }

        res.json(maids);
    } catch (error) {
        console.error('Error fetching maids:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        if (client) {
            await client.close();
            console.log('Closed MongoDB connection');
        }
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});