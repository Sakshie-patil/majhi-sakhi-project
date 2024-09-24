const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'maidHiringSystem';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ... (keep existing multer configuration)

// User Booking
app.post('/book-maid', async (req, res) => {
    let client;
    try {
        client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbName);
        const bookingsCollection = db.collection('bookings');

        const booking = {
            name: req.body.name,
            mobile: req.body.mobile,
            address: req.body.address,
            date: new Date(req.body.date),
            days: req.body.days,
            hours: req.body.hours,
            maidId: new ObjectId(req.body.maidId),
            status: 'pending',
            bookingDate: new Date()
        };

        await bookingsCollection.insertOne(booking);
        res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        console.error('Error booking maid:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (client) await client.close();
    }
});

// Maid Dashboard - Get Bookings
app.get('/maid/bookings/:maidId', async (req, res) => {
    let client;
    try {
        client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbName);
        const bookingsCollection = db.collection('bookings');

        const bookings = await bookingsCollection.find({ 
            maidId: new ObjectId(req.params.maidId) 
        }).toArray();

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching maid bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (client) await client.close();
    }
});

// Update Booking Status
app.put('/booking/:bookingId/status', async (req, res) => {
    let client;
    try {
        client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbName);
        const bookingsCollection = db.collection('bookings');

        await bookingsCollection.updateOne(
            { _id: new ObjectId(req.params.bookingId) },
            { $set: { status: req.body.status } }
        );

        res.json({ message: 'Booking status updated successfully' });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (client) await client.close();
    }
});

// ... (keep existing routes)

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});