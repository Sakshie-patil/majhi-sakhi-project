const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'maidHiringSystem';

app.use(express.json());
app.use(express.static(__dirname));

async function connectToMongo() {
    const client = await MongoClient.connect(mongoUrl);
    return client.db(dbName);
}

app.post('/login', async (req, res) => {
    try {
        const db = await connectToMongo();
        const collection = db.collection('maids');

        const maid = await collection.findOne({ email: req.body.email });

        if (maid && await bcrypt.compare(req.body.password, maid.password)) {
            res.json({ message: 'Login successful', maidId: maid._id });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/maid/bookings/:maidId', async (req, res) => {
    try {
        const db = await connectToMongo();
        const bookingsCollection = db.collection('bookings');

        const bookings = await bookingsCollection.find({ 
            maidId: new ObjectId(req.params.maidId) 
        }).toArray();

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching maid bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/booking/:bookingId/status', async (req, res) => {
    try {
        const db = await connectToMongo();
        const bookingsCollection = db.collection('bookings');

        await bookingsCollection.updateOne(
            { _id: new ObjectId(req.params.bookingId) },
            { $set: { status: req.body.status } }
        );

        res.json({ message: 'Booking status updated successfully' });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ... (keep other existing routes)

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});