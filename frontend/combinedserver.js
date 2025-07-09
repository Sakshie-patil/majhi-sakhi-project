const express = require("express")
//Loads MongoDB client and ObjectId helper from the MongoDB driver
const { MongoClient, ObjectId } = require("mongodb")
const multer = require("multer")  //middleware in express handle file uploads
const path = require("path")  // to handle file path
//allows you to interact with the file system on your computer.
const fs = require("fs")
// lets you define schemas and models 
const mongoose = require("mongoose")
//Parses incoming request data (like form inputs) into usable JS objects
const bodyParser = require("body-parser")

const app = express()
const port = 3002

const mongoUrl = "mongodb://localhost:27017"
const dbName = "maidFinderSystem"

// Automatically parses JSON requests
app.use(express.json())
app.use(express.urlencoded({ extended: true })) //Parses form data
app.use(express.static(__dirname))  //Serves static files

// Get all orders (admin view)
// all maid bookings from the database (for admin viewOrders.html) => (16)
app.get("/api/admin/orders", async (req, res) => {
  try {
    const db = await connectToMongo()
    const collection = db.collection("orders")
    const orders = await collection.find({}).toArray()
    res.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// //new maid booking form(userForm.html) => 17
// app.post("/book-maid", async (req, res) => {
//   try {
//     const db = await connectToMongo()
//     const collection = db.collection("orders")

//     const bookingData = {  // Move inside the request handler
//       ...req.body,
//       status: "Pending",
//       createdAt: new Date(),
//     }

//     const result = await collection.insertOne(bookingData)

//     if (result.insertedId) {
//       res.status(200).json({ message: "Booking successful", booking: bookingData })
//     } else {
//       res.status(500).json({ error: "Failed to create booking" })
//     }
//   } catch (error) {
//     console.error("Error during booking:", error)
//     res.status(500).json({ error: "Internal server error" })
//   }
// })
// single line harmless


// Update order status (admin action) pending/accepted/rejected => 18
app.put("/api/admin/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params
    const { status } = req.body

    const db = await connectToMongo()
    const collection = db.collection("orders")

    const result = await collection.updateOne({ _id: new ObjectId(orderId) }, { $set: { status: status } })

    if (result.modifiedCount === 1) {
      res.json({ message: "Order status updated successfully" })
    } else {
      res.status(404).json({ error: "Order not found" })
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get user's orders 
// for users history => 19
app.get("/api/user/orders", async (req, res) => {
  try {
    const db = await connectToMongo()
    const collection = db.collection("orders")
    // In a real application, you would filter by user ID
    // const userId = req.user.id; // Assuming you have user authentication
    const orders = await collection.find({}).toArray()
    res.json(orders)
  } catch (error) {
    console.error("Error fetching user orders:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// // Update the existing book-maid endpoint to include serviceman and service_name
// app.post("/book-maid", async (req, res) => {
//   try {
//     const db = await connectToMongo()
//     const collection = db.collection("orders")
//     const result = await collection.insertOne(bookingData)

//     if (result.insertedId) {
//       res.status(200).json({ message: "Booking successful", booking: bookingData })
//     } else {
//       res.status(500).json({ error: "Failed to create booking" })
//     }
//   } catch (error) {
//     console.error("Error during booking:", error)
//     res.status(500).json({ error: "Internal server error" })
//   }
// })

// Configure multer for file uploads => 20
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/"
    if (file.fieldname === "idProofImage") {
      uploadPath += "id_proofs/"
    } else if (file.fieldname === "profilePicture") {
      uploadPath += "profile_pictures/"
    } else if (file.fieldname === "photo") {
      uploadPath += "maid_photos/"
    }
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({ storage: storage })

// // MongoDB connection 
// async function connectToMongo() {
//   const client = new MongoClient(mongoUrl, { useUnifiedTopology: true })
//   try {
//     await client.connect()
//     console.log("Connected successfully to MongoDB")
//     return client.db(dbName)
//   } catch (err) {
//     console.error("Error connecting to MongoDB:", err)
//     throw err
//   }
// }

// Frontend routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

app.get("/results.html", (req, res) => {
  res.sendFile(path.join(__dirname, "results.html"))
})


// This searches bookings by user's name and phone number instead of userId
async function connectToMongo() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maidFinderSystem';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB");
        return client.db();
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

// Update your existing /api/user-bookings endpoint to handle userId parameter
// for showing users order history on profile (9)
app.get('/api/user-bookings', async (req, res) => { // HTTP GET API endpoint that the frontend will call when it wants to show a user’s previous bookings.
    try {
        const { name, phone, userId } = req.query;
        console.log('Searching bookings for:', { name, phone, userId });
        
        const db = await connectToMongo();
        const ordersCollection = db.collection('orders');
        
        let query = {};
        
        // If userId is provided, filter directly using it.
        if (userId) {
            query.userId = userId;
        } else if (name && phone) {
            // Fallback to name and phone search
            query = {
                $and: [
                    { name: { $regex: new RegExp(name, 'i') } },
                    { contact: phone }
                ]
            };
        } else {
            return res.status(400).json({ error: 'User ID or both name and phone number are required' });
        }
        
        const bookings = await ordersCollection.find(query).sort({ createdAt: -1 }).toArray();
        
        console.log('Found bookings:', bookings.length);
        
        // Get maid details if available
        const maidsCollection = db.collection('maids');
        
        for (let booking of bookings) {
            if (booking.maidId) {
                try {
                    const maid = await maidsCollection.findOne({ _id: new ObjectId(booking.maidId) });
                    if (maid) {
                        booking.maidName = maid.fullName;
                    }
                } catch (err) {
                    console.log('Error fetching maid details:', err);
                    booking.maidName = 'Unknown Maid';
                }
            } else {
                booking.maidName = 'Maid Service';
            }
        }
        
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Admin routes => admin login part (5)
//Serves the admin login page (HTML file).
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "adminLogin.html")) // sends file to browser
})

app.post("/admin/login", async (req, res) => {
  try {
    const db = await connectToMongo()   // Connect to MongoDB
    const collection = db.collection("admins")  // Access "admins" collection

    const admin = await collection.findOne({ username: req.body.username })

    if (admin && req.body.password === admin.password) {
      res.json({ message: "Login successful", adminId: admin._id })
    } else {
      res.status(401).json({ error: "Invalid username or password" })
    }
  } catch (error) {
    console.error("Error during admin login:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// User registration => (2)
//This creates a POST route at /register.
//It handles form data along with multiple file uploads using multer.
app.post(
  "/register",
  upload.fields([
    { name: "idProofImage", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { firstName, lastName, username, password, email, phoneNumber, address } = req.body // Extracting Form Data
      const idProofImage = req.files["idProofImage"]?.[0].path || null
      const profilePicture = req.files["profilePicture"]?.[0].path || null

      //Uses the users collection to store the new use
      const db = await connectToMongo()
      const collection = db.collection("users")

      // Insert User into Database 
      const result = await collection.insertOne({
        firstName,
        lastName,
        username,
        password,
        email,
        phoneNumber,
        address,
        idProofImage,
        profilePicture,
        createdAt: new Date(),
      })

      res.status(201).json({ message: "User registered successfully!", userId: result.insertedId })
    } catch (error) {
      console.error("Error during user registration:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

// User login code => (1)
// Express.js POST route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body // ➡️ Reads the credentials sent from frontend using fetch()

    // Connects to MongoDB database and accesses the users collection.
    const db = await connectToMongo()
    const collection = db.collection("users")

    // Searches for a user in MongoDB database by username.
    const user = await collection.findOne({ username })

    //check 
    if (user && user.password === password) {
      // Login successful
      res.json({
        message: "Login successful",
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      })
    } else {
      // Invalid credentials
      res.status(401).json({ error: "Invalid username or password" })
    }
  } catch (error) {
    console.error("Error during user login:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})


// User profile => when user logs in so this api get called and retrives info from db about user (10)
app.get("/profile", async (req, res) => {
  const userId = req.query.id // Changed from userId to id to match the client-side

  try {
    const db = await connectToMongo()
    const collection = db.collection("users")

    // Fetch user details from the database
    const user = await collection.findOne({ _id: new ObjectId(userId) })

    if (user) {
      res.json({
        message: "User profile retrieved successfully",
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          profilePicture: user.profilePicture,
        },
      })
    } else {
      res.status(404).json({ error: "User not found" })
    }
  } catch (error) {
    console.error("Error retrieving user profile:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Admin dashboard route => (11)
app.get("/admin/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "adminDashboard.html"))
})

// Maid registration form route => (7)
//Sends the maidForm.html file (i.e., the registration form page) to the client.
app.get("/maid-registration", (req, res) => {
  res.sendFile(path.join(__dirname, "maidForm.html"))
})

//  form submission
// Handles form submission data and file uploads.
//upload.fields(...): Middleware from Multer to handle multiple files:
app.post(
  "/register-maid",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "idProofImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { fullName, email, gender, locality, serviceType, workingHours, experience, salary, idProof } = req.body

      const photo = req.files["photo"]?.[0].path || null
      const idProofImage = req.files["idProofImage"]?.[0].path || null

      const db = await connectToMongo()   // Store Data in MongoDB
      const collection = db.collection("maids")   // inside collection maids

      const result = await collection.insertOne({
        fullName,
        email,
        gender,
        locality,
        serviceType,
        workingHours,
        experience,
        salary,
        idProof,
        photo,
        idProofImage,
        createdAt: new Date(),
      })

      //If Success:
      res.json({ success: true, message: "Maid registered successfully!" })
    } catch (error) {   //If Error:
      console.error("Error during maid registration:", error)
      res.status(500).json({ success: false, message: "An error occurred during registration. Please try again." })
    }
  },
)

// maid search => Search the database for maids based on the selected locality and service type 
// Maid search endpoint (3)
app.post("/api/search-maids", async (req, res) => {
  try {
    const { locality, serviceType } = req.body
    const db = await connectToMongo()
    const collection = db.collection("maids")

    const query = { locality, serviceType }
    const maids = await collection.find(query).toArray()

    res.json(maids)
  } catch (error) {
    console.error("Error searching for maids:", error)
    res.status(500).json({ error: "An error occurred while searching for maids. Please try again." })
  }
})

// maid booking (4)
app.post("/api/book-maid", async (req, res) => {
  try {
    const { maidId, userId, date, days, hours } = req.body
    const db = await connectToMongo()
    const bookingsCollection = db.collection("bookings")

    const result = await bookingsCollection.insertOne({
      maidId,
      userId,
      date,
      days,
      hours,
      status: "Pending",
      createdAt: new Date(),
    })

    res.json({ success: true, bookingId: result.insertedId })
  } catch (error) {
    console.error("Error booking maid:", error)
    res.status(500).json({ error: "An error occurred while booking the maid. Please try again." })
  }
})

// Serve userForm.html => userform route (12)
app.get("/userForm.html", (req, res) => {
  res.sendFile(path.join(__dirname, "userForm.html"))
})

// Handle maid booking =>  submission of the maid booking form.
app.post("/book-maid", async (req, res) => {
  try {
    const db = await connectToMongo()
    const collection = db.collection("orders")

    const bookingData = {
      ...req.body,
      status: "Pending",
      createdAt: new Date(),
    }

    const result = await collection.insertOne(bookingData)

    if (result.insertedId) {
      res.status(200).json({ message: "Booking successful", booking: bookingData })
    } else {
      res.status(500).json({ error: "Failed to create booking" })
    }
  } catch (error) {
    console.error("Error during booking:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Add a new endpoint to serve the orders page (14)
app.get("/orders.html", (req, res) => {
  res.sendFile(path.join(__dirname, "orders.html"))
})

// To connect to MongoDB, define data schemas using Mongoose, and provide a real-time API to get the total count of users and maids — helpful for showing stats on an admin dashboard.x  (15) 

// // MongoDB Connection using Mongoose
// sakshi old mongo connection start
// mongoose.connect("mongodb://localhost/maidFinderSystem", { useNewUrlParser: true, useUnifiedTopology: true })

// // Defining schemas
// const userSchema = new mongoose.Schema({
//   username: String,
//   password: String,
// })
// sakshii old mongo connection ends

// To connect to MongoDB, define data schemas using Mongoose, and provide a real-time API to get the total count of users and maids — helpful for showing stats on an admin dashboard.x  (15) 

// MongoDB Connection using Mongoose
// Use the environment variable for Mongoose connection as well
const MONGODB_URI_MONGOOSE = process.env.MONGO_URI; // Make sure the name matches what you set in Railway

if (!MONGODB_URI_MONGOOSE) {
    console.error("CRITICAL ERROR: MONGO_URI environment variable not set for Mongoose connection!");
    process.exit(1);
}

mongoose.connect(MONGODB_URI_MONGOOSE) // Remove deprecated options: { useNewUrlParser: true, useUnifiedTopology: true }
  .then(() => console.log('Mongoose connected successfully!'))
  .catch(err => {
      console.error('Mongoose connection error:', err);
      process.exit(1);
  });


// Defining schemas
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
})
// ... rest of your code

const maidSchema = new mongoose.Schema({
  name: String,
  // Add other maid fields as needed
})

const orderSchema = new mongoose.Schema({
  serviceman: String,
  customer: String,
  service_name: String,
  date: String,
  days: Number,
  hours: Number,
  status: { type: String, default: "Pending" },
})

// Creating models
const User = mongoose.model("User", userSchema)
const Maid = mongoose.model("Maid", maidSchema)
const Order = mongoose.model("Order", orderSchema)

app.use(bodyParser.json())

// Real-time total maids and users count (for admin dashboard)
app.get("/api/realtime-stats", async (req, res) => {
  try {
    const db = await connectToMongo();
    const usersCount = await db.collection("users").countDocuments();
    const maidsCount = await db.collection("maids").countDocuments();

    res.json({ totalUsers: usersCount, totalMaids: maidsCount });
  } catch (error) {
    console.error("Error fetching real-time stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get total booking requests count (6) => admin dashboard
// Updated loadDashboardStats function for your dashboard
async function loadDashboardStats() {
    try {
        // Add loading state
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.add('loading');
        });

        // Fetch real-time stats from single endpoint
        const statsResponse = await fetch('/api/realtime-stats');

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('Received stats:', stats); // Debug log
            
            function updateStatCard(elementId, value) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = value;
                } else {
                    console.warn(`Element with id "${elementId}" not found.`);
                }
            }

            updateStatCard('totalUsers', stats.totalUsers || 0);
            updateStatCard('totalMaids', stats.totalMaids || 0);
            updateStatCard('totalRequests', stats.totalRequests || 0);
        } else {
            console.error('Failed to fetch stats:', statsResponse.status);
            // Set default values on error
            function updateStatCard(elementId, value) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = value;
                } else {
                    console.warn(`Element with id "${elementId}" not found.`);
                }
            }
            updateStatCard('totalUsers', 0);
            updateStatCard('totalMaids', 0);
            updateStatCard('totalRequests', 0);
        }

        // Remove loading state
        setTimeout(() => {
            document.querySelectorAll('.stat-card').forEach(card => {
                card.classList.remove('loading');
            });
        }, 500);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Remove loading state on error
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.remove('loading');
        });
    }
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
