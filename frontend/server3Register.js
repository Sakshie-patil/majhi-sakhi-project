const express = require('express');
const { MongoClient } = require('mongodb');
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/register', upload.fields([
    { name: 'idProofImage', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
]), async (req, res) => {
    let client;

    try {
        client = await MongoClient.connect(mongoUrl);
        const db = client.db(dbName);
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
    } finally {
        if (client) {
            await client.close();
        }
    }
});

// Keep your existing login route here

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});