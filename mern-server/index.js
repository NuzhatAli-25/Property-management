// index.js

require('dotenv').config();

const http = require('http');
const { Server } = require("socket.io");
const express = require('express');
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Integrate Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// --- MongoDB Configuration ---
const uri = process.env.DB_URI;
const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});
const JWT_SECRET = process.env.JWT_SECRET;

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg or .jpeg files are allowed'), false);
        }
    }
});

// --- JWT Verification Middleware ---
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).send({ message: 'No token provided.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).send({ message: 'Malformed token.' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({ message: 'Failed to authenticate token.' });
        req.userId = decoded.id;
        next();
    });
}

// --- Socket.IO Connection Logic ---
let onlineUsers = {};
io.on('connection', (socket) => {
    socket.on('add_user', (userId) => {
        onlineUsers[userId] = socket.id;
    });
    socket.on('send_message', async ({ senderId, receiverId, text }) => {
        const receiverSocketId = onlineUsers[receiverId];
        const messagesCollection = client.db("PropertyInventory").collection("messages");
        const conversationId = [senderId, receiverId].sort().join('_');
        const message = {
            sender: new ObjectId(senderId),
            text,
            timestamp: new Date()
        };
        await messagesCollection.updateOne(
            { _id: conversationId },
            { 
                $push: { messages: message },
                $set: { participants: [new ObjectId(senderId), new ObjectId(receiverId)] }
            },
            { upsert: true }
        );
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receive_message', message);
        }
    });
    socket.on('disconnect', () => {
        for (const userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
                break;
            }
        }
    });
});

async function run() {
    try {
        await client.connect();
        const database = client.db("PropertyInventory");
        const propertyCollection = database.collection("property");
        const userCollection = database.collection("users");
        const messagesCollection = database.collection("messages");
        
        console.log("Successfully connected to MongoDB!");

        // --- Authentication Routes ---
        app.post('/api/signup', async (req, res) => {
            const { name, phone, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            try {
                await userCollection.insertOne({ name, phone, email, password: hashedPassword, purchasedProperties: [], shortlist: [], reviews: [], trustedBy: [], goldenBadges: [] });
                res.status(201).send({ message: "User created successfully!" });
            } catch (error) {
                res.status(500).send({ message: "Error creating user", error });
            }
        });

        app.post('/api/login', async (req, res) => {
            const { email, password } = req.body;
            const user = await userCollection.findOne({ email });
            if (!user) return res.status(404).send({ message: "User not found." });
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: 86400 });
            res.status(200).send({ accessToken: token });
        });
        
        app.post('/api/forgot-password', async (req, res) => {
            const { email, newPassword } = req.body;
            const user = await userCollection.findOne({ email });
            if (!user) return res.status(404).send({ message: "User not found." });
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await userCollection.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
            res.status(200).send({ message: "Password updated successfully." });
        });

        // --- User Profile Routes ---
        app.get('/api/profile', verifyToken, async (req, res) => {
            try {
                const user = await userCollection.findOne({ _id: new ObjectId(req.userId) }, { projection: { password: 0 } });
                if (!user) return res.status(404).send("User not found");
                if (user.purchasedProperties && user.purchasedProperties.length > 0) {
                    const purchasedIds = user.purchasedProperties.map(id => new ObjectId(id));
                    user.purchasedPropertiesDetails = await propertyCollection.find({ _id: { $in: purchasedIds } }).toArray();
                } else {
                    user.purchasedPropertiesDetails = [];
                }
                res.status(200).json(user);
            } catch (error) {
                res.status(500).send({ message: "Error fetching profile", error });
            }
        });

        app.patch('/api/profile', verifyToken, async (req, res) => {
            const { name, phone } = req.body;
            try {
                const result = await userCollection.updateOne({ _id: new ObjectId(req.userId) }, { $set: { name, phone } });
                res.status(200).send(result);
            } catch (error) {
                res.status(500).send({ message: "Error updating profile", error });
            }
        });

        // --- Seller Profile & Chat Routes ---
        app.get('/api/seller/:id', verifyToken, async (req, res) => {
            try {
                const seller = await userCollection.findOne({ _id: new ObjectId(req.params.id) }, { projection: { password: 0, purchasedProperties: 0, shortlist: 0 } });
                if (!seller) return res.status(404).send({ message: "Seller not found" });
                seller.trustCount = seller.trustedBy ? seller.trustedBy.length : 0;
                seller.goldenBadgeCount = seller.goldenBadges ? seller.goldenBadges.length : 0;
                res.status(200).json(seller);
            } catch (error) {
                res.status(500).send({ message: "Error fetching seller profile", error });
            }
        });
        
        app.get('/api/chat/:recipientId', verifyToken, async (req, res) => {
            try {
                const selfId = new ObjectId(req.userId);
                const recipientId = new ObjectId(req.params.recipientId);
                const conversationId = [selfId.toString(), recipientId.toString()].sort().join('_');
                const conversation = await messagesCollection.findOne({ _id: conversationId });
                res.json(conversation ? conversation.messages : []);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching chat history.' });
            }
        });

        // NEW ROUTE: Get all conversations for the logged-in user
        app.get('/api/conversations', verifyToken, async (req, res) => {
            try {
                const currentUserId = new ObjectId(req.userId);
                const conversations = await messagesCollection.find({ participants: currentUserId }).toArray();
                
                const populatedConversations = await Promise.all(conversations.map(async (convo) => {
                    const otherParticipantId = convo.participants.find(p => !p.equals(currentUserId));
                    if (!otherParticipantId) return null;

                    const otherParticipant = await userCollection.findOne(
                        { _id: otherParticipantId },
                        { projection: { name: 1 } }
                    );

                    const lastMessage = convo.messages[convo.messages.length - 1];

                    return {
                        _id: convo._id,
                        otherParticipant,
                        lastMessage
                    };
                }));

                res.json(populatedConversations.filter(c => c !== null));

            } catch (error) {
                 res.status(500).json({ message: 'Error fetching conversations.' });
            }
        });

        // (Other routes like review, trust, golden-badge remain the same)
        app.post('/api/seller/:id/review', verifyToken, async (req, res) => {
            const { reviewText } = req.body;
            const reviewer = await userCollection.findOne({ _id: new ObjectId(req.userId) });
            const review = { reviewerId: req.userId, reviewerName: reviewer.name, text: reviewText, date: new Date() };
            await userCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $push: { reviews: review } });
            res.status(200).send({ message: "Review added successfully" });
        });
        app.post('/api/seller/:id/trust', verifyToken, async (req, res) => {
            await userCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $addToSet: { trustedBy: new ObjectId(req.userId) } });
            res.status(200).send({ message: "Seller marked as trusted" });
        });
        app.post('/api/seller/:id/golden-badge', verifyToken, async (req, res) => {
             await userCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $addToSet: { goldenBadges: new ObjectId(req.userId) } });
            res.status(200).send({ message: "Golden badge given" });
        });
        
        // --- Property, Bidding, Shortlist, Purchase Routes (remain the same) ---
        // ... (All other routes are unchanged, so I'm omitting them for brevity. Ensure they are present in your file)
         app.post("/upload-property", verifyToken, upload.single('image'), async (req, res) => {
            if (!req.file) return res.status(400).send("No image file uploaded.");
            const data = req.body;
            const price = parseFloat(data.price) || 0;
            const vatRate = parseFloat(data.vatRate) || 0;
            const previousPrice = parseFloat(data.previousPrice) || 0;
            const priceWithVat = price + (price * (vatRate / 100));
            const priceChange = price - previousPrice;
            const incrementDecrementText = priceChange >= 0 ? `${priceChange.toFixed(2)} (Increment)` : `${Math.abs(priceChange).toFixed(2)} (Decrement)`;
            const propertyData = { ...data, price, vatRate, previousPrice, priceWithVat: priceWithVat.toFixed(2), priceChange: incrementDecrementText, image: req.file.path, ownerId: new ObjectId(req.userId), status: 'available', bids: [], };
            const result = await propertyCollection.insertOne(propertyData);
            res.send(result);
        });
        app.get("/all-property", async (req, res) => {
            let query = { status: { $in: ['available', 'pending'] } };
            if (req.query.type) query.type = { $regex: req.query.type, $options: 'i' };
            if (req.query.location) query.location = { $regex: req.query.location, $options: 'i' };
            if (req.query.purpose) query.purpose = { $regex: req.query.purpose, $options: 'i' };
            const result = await propertyCollection.find(query).toArray();
            res.send(result);
        });
        app.get("/property/:id", verifyToken, async (req, res) => {
            const property = await propertyCollection.findOne({_id: new ObjectId(req.params.id)});
            res.send(property);
        });
        app.post('/api/property/:id/bid', verifyToken, async (req, res) => {
            const { price } = req.body;
            const user = await userCollection.findOne({ _id: new ObjectId(req.userId) });
            const bid = { userId: req.userId, userName: user.name, price: parseFloat(price), date: new Date() };
            await propertyCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $push: { bids: bid } });
            res.status(200).send({ message: "Bid placed successfully" });
        });
        app.post('/api/property/:id/accept-bid', verifyToken, async (req, res) => {
            const { bidUserId, bidPrice } = req.body;
            const property = await propertyCollection.findOne({ _id: new ObjectId(req.params.id) });
            if (property.ownerId.toString() !== req.userId) {
                return res.status(403).send({ message: "You are not the owner of this property." });
            }
            await propertyCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { winningBidder: new ObjectId(bidUserId), winningPrice: parseFloat(bidPrice), status: 'pending' } });
            res.status(200).send({ message: "Bid accepted." });
        });
        app.post('/api/shortlist/:propertyId', verifyToken, async (req, res) => {
            await userCollection.updateOne({ _id: new ObjectId(req.userId) }, { $addToSet: { shortlist: new ObjectId(req.params.propertyId) } });
            res.status(200).send({ message: "Added to shortlist." });
        });
        app.get('/api/shortlist', verifyToken, async (req, res) => {
            const user = await userCollection.findOne({ _id: new ObjectId(req.userId) });
            if (user && user.shortlist) {
                const shortlistedProperties = await propertyCollection.find({ _id: { $in: user.shortlist }, status: 'available' }).toArray();
                res.send(shortlistedProperties);
            } else {
                res.send([]);
            }
        });
        app.post('/api/purchase/:propertyId', verifyToken, async (req, res) => {
            const propertyId = new ObjectId(req.params.propertyId);
            const userId = new ObjectId(req.userId);
            await propertyCollection.updateOne({ _id: propertyId }, { $set: { status: 'sold', buyerId: userId } });
            await userCollection.updateOne({ _id: userId }, { $push: { purchasedProperties: propertyId } });
            await userCollection.updateMany({}, { $pull: { shortlist: propertyId } });
            res.status(200).send({ message: "Purchase successful!" });
        });
        
        app.get('/', (req, res) => res.send('Property Server is Running!'));

    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
