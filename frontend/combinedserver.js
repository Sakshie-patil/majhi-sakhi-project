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

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        if (file.fieldname === 'idProofImage') {
            uploadPath += 'id_proofs/';
        } else if (file.fieldname === 'profilePicture') {
            uploadPath += 'profile_pictures/';
        }
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Helper function to connect to MongoDB
async function connectToMongo() {
    const client = await MongoClient.connect(mongoUrl);
    return client.db(dbName);
}

// Routes
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

    try {
        const db = await connectToMongo();
        const collection = db.collection('maids');

        let query = {};
        if (city) query.city = city;
        if (serviceType) query.serviceType = serviceType;

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
    }
});

app.post('/login', async (req, res) => {
    try {
        const db = await connectToMongo();
        const collection = db.collection('maids');

        console.log('Login attempt for email:', req.body.email);

        const maid = await collection.findOne({ email: req.body.email });

        if (maid) {
            const isPasswordValid = await bcrypt.compare(req.body.password, maid.password);

            if (isPasswordValid) {
                console.log('Password is valid');
                res.json({ message: 'Login successful', maidId: maid._id });
            } else {
                console.log('Password is invalid');
                res.status(401).json({ error: 'Invalid email or password' });
            }
        } else {
            console.log('Maid not found in database');
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/register', upload.fields([
    { name: 'idProofImage', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
]), async (req, res) => {
    try {
        const db = await connectToMongo();
        const collection = db.collection('maids');

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const maid = {
            fullName: req.body.fullName,
            email: req.body.email,
            password: hashedPassword,
            address: req.body.address,
            city: req.body.city,
            serviceType: req.body.serviceType,
            workingHours: req.body.workingHours,
            yearsOfExperience: req.body.yearsOfExperience,
            idProofType: req.body.idProofType,
            idProofImage: req.files['idProofImage'][0].path,
            salary: req.body.salary,
            profilePicture: req.files['profilePicture'][0].path,
            registrationDate: new Date()
        };

        await collection.insertOne(maid);
        res.status(201).json({ message: 'Maid registered successfully' });
    } catch (error) {
        console.error('Error registering maid:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/book-maid', async (req, res) => {
    try {
        const db = await connectToMongo();
        const bookingsCollection = db.collection('bookings');

        // Validate maidId
        if (!req.body.maidId || !ObjectId.isValid(req.body.maidId)) {
            return res.status(400).json({ error: 'Invalid maid ID provided' });
        }

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
    }
});

app.get('/maid/bookings/:maidId', async (req, res) => {
    try {
        const db = await connectToMongo();
        const bookingsCollection = db.collection('bookings');

        if (!ObjectId.isValid(req.params.maidId)) {
            return res.status(400).json({ error: 'Invalid maid ID provided' });
        }

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

        if (!ObjectId.isValid(req.params.bookingId)) {
            return res.status(400).json({ error: 'Invalid booking ID provided' });
        }

        const result = await bookingsCollection.updateOne(
            { _id: new ObjectId(req.params.bookingId) },
            { $set: { status: req.body.status } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ message: 'Booking status updated successfully' });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Combined server running at http://localhost:${port}`);
});