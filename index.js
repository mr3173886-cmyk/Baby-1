const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// মঙ্গোডিবি কানেকশন ইউআরএল
const MONGO_URI = "mongodb+srv://mr3173886_db_user:taninislam123tareq@cluster0.48yeksq.mongodb.net/HinataBot?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Database Connected Successfully"))
    .catch(err => console.error("Database connection error:", err));

// ডেটাবেজ স্কিমা ও মডেল
const ReplySchema = new mongoose.Schema({
    trigger: { type: String, required: true, unique: true },
    responses: { type: [String], required: true }
});
const Reply = mongoose.model('Reply', ReplySchema);

// হোম রাউট ফিক্স (সরাসরি লিংকে ঢুকলে যেন ড্যাশবোর্ড ফাইলটি লোড হয়)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ডাইনামিক ফাইল ডিটেকশন রুট
app.get('/api/files', (req, res) => {
    const publicPath = path.join(__dirname, 'public');
    fs.readdir(publicPath, (err, files) => {
        if (err) return res.status(500).json({ error: "Error reading folder" });
        const htmlFiles = files.filter(file => file.endsWith('.html') && file !== 'index.html');
        res.json(htmlFiles);
    });
});

// 🔥 [MAX UPGRADE] আনলিমিটেড এক ক্লিকে Teach দেওয়ার Bulk API
app.post('/api/jan/bulk-teach', async (req, res) => {
    try {
        const { textData } = req.body;
        if (!textData) return res.status(400).json({ error: "No data provided" });

        const lines = textData.split("\n");
        let successCount = 0;

        for (let line of lines) {
            if (!line.includes("-")) continue;

            const parts = line.split("-");
            const trigger = parts[0].replace("bby teach", "").trim().toLowerCase();
            const responseText = parts[1].trim();

            if (!trigger || !responseText) continue;

            const responseArray = responseText.split(" - ").map(r => r.trim());

            let data = await Reply.findOne({ trigger: trigger });
            if (data) {
                data.responses = [...new Set([...data.responses, ...responseArray])];
                await data.save();
            } else {
                data = new Reply({ trigger: trigger, responses: responseArray });
                await data.save();
            }
            successCount++;
        }

        const totalCount = await Reply.countDocuments();
        res.json({ success: true, message: `✅ সফলভাবে ${successCount} টি প্রশ্ন ডাটাবেজে সেভ হয়েছে!`, count: totalCount });
    } catch (err) {
        res.status(500).json({ error: "Server error during bulk teach" });
    }
});

// সিঙ্গেল Teach কমান্ডের এপিআই
app.post('/api/jan/teach', async (req, res) => {
    try {
        const { trigger, responses } = req.body;
        if (!trigger || !responses) return res.status(400).json({ error: "Missing data" });

        const cleanTrigger = trigger.trim().toLowerCase();
        const responseArray = responses.split(" - ").map(r => r.trim());

        let data = await Reply.findOne({ trigger: cleanTrigger });
        if (data) {
            data.responses = [...new Set([...data.responses, ...responseArray])];
            await data.save();
        } else {
            data = new Reply({ trigger: cleanTrigger, responses: responseArray });
            await data.save();
        }

        const totalCount = await Reply.countDocuments();
        res.json({ success: true, count: totalCount });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// বটের চ্যাটের এপিআই (Hinata Endpoint)
app.post('/api/hinata', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.json({ message: "বলো বে比" });

        const cleanText = text.trim().toLowerCase();
        const data = await Reply.findOne({ trigger: cleanText });

        if (data && data.responses.length > 0) {
            const randomReply = data.responses[Math.floor(Math.random() * data.responses.length)];
            res.json({ message: randomReply });
        } else {
            res.json({ message: "sikai deu 🥺" });
        }
    } catch (err) {
        res.json({ message: "error janu🥹" });
    }
});

// রিমুভ কমান্ডের এপিআই
app.delete('/api/jan/remove', async (req, res) => {
    try {
        const { trigger, index } = req.body;
        const cleanTrigger = trigger.trim().toLowerCase();
        const data = await Reply.findOne({ trigger: cleanTrigger });

        if (!data) return res.json({ message: "❌ এই প্রশ্নের কোনো উত্তর খুঁজে পাওয়া যায়নি।" });

        if (index >= 0 && index < data.responses.length) {
            data.responses.splice(index, 1);
            if (data.responses.length === 0) {
                await Reply.deleteOne({ trigger: cleanTrigger });
            } else {
                await data.save();
            }
            res.json({ message: "✅ উত্তরটি সফলভাবে মুছে ফেলা হয়েছে।" });
        } else {
            res.json({ message: "❌ ভুল ইনডেক্স নম্বর।" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ডাটাবেজ কাউন্ট এপিআই
app.get('/api/jan/list', async (req, res) => {
    try {
        const total = await Reply.countDocuments();
        res.json({ message: `👑 টোটাল ডাটাবেজে ${total} টি উত্তর আছে।` });
    } catch (err) {
        res.status(500).json({ error: "Error fetching count" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
                                             
