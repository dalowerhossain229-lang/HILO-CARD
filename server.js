const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - গ্লোবাল গেটওয়ে সকেট প্রোটোকল লক ভাই ভাই]
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob:; style-src * 'unsafe-inline'; font-src * data:;");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// 🎰 [উইনগো কালার ট্রেড ওরিজিনাল ডোমেইন সিঙ্ক ভাই ভাই]
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 
const cardSuitsPool = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স ইন্টারсеপ্টর গেটওয়ে (১ শতভাগ টাইমআউট ও জ্যাম ব্লকার বর্ম ওস্তাদ)
app.get('/api/hilo-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    const targetWallet = wallet || "main";
    try {
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "balance", // 🔒 বাজি ট্র্যাপ ও টাইমআউট এড়াতে সরাসরি পিওর ব্যালেন্স কি-নেম পাস লক ভাই ভাই
            username: userId,
            amount: 0,
            wallet: targetWallet,
            game: "hilocard"
        }, { timeout: 15000 });

        if (response.data && (response.data.status === "ok" || response.data.success === true)) {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { 
        console.log("Hi-Lo Balance Stream Reconnected.");
        return res.json({ success: false, balance: 0 }); 
    }
});

// ইউজারের অ্যাক্টিভ রানিং গেম সেশন ট্র্যাকার মেমোরি নোড ভাই ভাই
let activeHiLoSessions = {};

// 🛫 ২. হাই-লো কার্ড কোর ট্রানজেকশন ডিল রাউট (START DEAL - POST Route)
app.post('/api/hilo-deal', async (req, res) => {
    const { userId, amount, wallet } = req.body;
    const reqAmount = parseFloat(amount) || 50;
    const finalGameName = "hilocard"; // 🎯 লবির কি-শর্টকোড টাইট লক
    const targetWallet = wallet || "main";

    if (reqAmount < 1 || reqAmount > 20000) {
        return res.json({ success: false, message: "🚨 Invalid Bet Parameter (৳১ - ৳Subcontinent)" });
    }

    try {
        // 🔒 [ব্যালেন্স ডেবিট প্রোটোকল]: বাজি প্লে করার সাথে সাথে ১ম হিটে একবারই অ্যাকাউন্ট থেকে বাজি কাটার রিকোয়েস্ট যাবে ভাই
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: reqAmount, wallet: targetWallet, game: finalGameName
        }, { timeout: 30000 });
        
        if (!balResponse.data || balResponse.data.status !== "ok") {
            return res.json({ success: false, message: "❌ Database Sync Error or Insufficient Balance!" });
        }

        let currentDbBalance = parseFloat(balResponse.data.balance);
        
        // ওরিজিনাল তাসের প্রথম বেস কার্ড ড্রপ মেকানিজম (A=১, J=১১, Q=১২, K=১৩)
        let baseValue = Math.floor(Math.random() * 13) + 1;
        let ranks = {1:"A", 11:"J", 12:"Q", 13:"K"};
        let currentCard = {
            value: ranks[baseValue] || baseValue.toString(),
            numericValue: baseValue,
            suit: cardSuitsPool[Math.floor(Math.random() * 4)]
        };

        // মেমরিতে এই সেশন টোকেন ডাটা লক করে রাখা হলো যাতে HI/LO চাল একুরেট ট্র্যাক করা যায় ওস্তাদ
        activeHiLoSessions[userId] = {
            currentCard: currentCard,
            reqAmount: reqAmount,
            wallet: targetWallet,
            currentDbBalance: currentDbBalance
        };

        // 📈 গেম স্টেট "playing" (রানিং) স্ট্যাটাসে ফ্রন্টএন্ডে যাবে, যাতে HI এবং LO বোতাম দুটি সচল অন হয়!
        return res.json({
            success: true,
            balance: currentDbBalance,
            status: "playing",
            data: { balance: currentDbBalance }, 
            gameData: {
                currentCard: currentCard,
                status: "playing",
                winAmount: 0,
                result: "Base Card Drawn. Guess Next!"
            }
        });

    } catch (e) { return res.json({ success: false, message: "⚠️ Timeout! Click DEAL again." }); }
});

// 🛫 ৩. প্লেয়ারের HI / LO অ্যাকশন গেটওয়ে ইন্টারসেপ্টর চ্যাম ভাই ভাই (এক শটে ফাইনাল সেটেলমেন্ট)
app.post('/api/hilo-guess', async (req, res) => {
    const { userId, choice } = req.body; // choice: "HI" অথবা "LO"
    let session = activeHiLoSessions[userId];
    
    if (!session) return res.json({ success: false, message: "X Game session expired! Please click DEAL again." });

    try {
        let ranks = {1:"A", 11:"J", 12:"Q", 13:"K"};
        let nextValue = Math.floor(Math.random() * 13) + 1;
        let nextCard = {
            value: ranks[nextValue] || nextValue.toString(),
            numericValue: nextValue,
            suit: cardSuitsPool[Math.floor(Math.random() * 4)]
        };

        let prevValue = session.currentCard.numericValue;
        let finalStatus = "lose";
        let winMultiplier = 0.00;
        let reasonStr = "Wrong Guess! 💥";

        // 🎰 [🎰 ৯৫% ক্যাসিনো RTP এবং হাই-লো গাণিতিক কন্ডিশন ফিল্টার ভাই ভাই]
        if (choice === "HI") {
            if (nextValue > prevValue) { finalStatus = "win"; winMultiplier = 1.95; reasonStr = "Higher! Grand Win 🎉"; }
            else if (nextValue === prevValue) { finalStatus = "push"; winMultiplier = 1.00; reasonStr = "Same Card! Refund ⧗"; }
        } else if (choice === "LO") {
            if (nextValue < prevValue) { finalStatus = "win"; winMultiplier = 1.95; reasonStr = "Lower! Grand Win 🎉"; }
            else if (nextValue === prevValue) { finalStatus = "push"; winMultiplier = 1.00; reasonStr = "Same Card! Refund ⧗"; }
        }

        // আরটিপি কন্ট্রোল নব স্বাভাবিক ট্র্যাকে ৪৩% এ ব্যালেন্সড লক ওস্তাদ
        if (finalStatus === "win" && Math.random() > 0.43) {
            // যদি আরটিপি বাউন্স ফিল্টার ফায়ার হয়, তবে কার্ড সেকেন্ডারি ড্রপে রিপ্লেস করে লস ট্র্যাকে নেওয়া হলো ওস্তাদ
            nextValue = choice === "HI" ? Math.max(1, prevValue - 1) : Math.min(13, prevValue + 1);
            nextCard.value = ranks[nextValue] || nextValue.toString();
            nextCard.numericValue = nextValue;
            finalStatus = "lose"; winMultiplier = 0.00; reasonStr = "Wrong Guess! 💥";
        }

        // 🎯 [মেগা কিলার জিরো-ডাবল-ডেবিট স্টেক ব্যালেন্সার বর্ম ভাই ভাই]
        let winAmount = 0, dbAction = "win", dbAmount = 0;
        if (finalStatus === "win") {
            winAmount = Math.round(session.reqAmount * winMultiplier);
            dbAction = "win"; dbAmount = winAmount;
        } else if (finalStatus === "push") {
            winAmount = session.reqAmount;
            dbAction = "win"; dbAmount = winAmount;
        } else {
            dbAction = "win"; dbAmount = 0; // 🔒 বাজি লস হলে ডাটাবেজে ২য় বার কোনো টাকা কাটার কমান্ড যাবে না!
        }

        let phpPayload = { 
            action: dbAction, username: userId, amount: dbAmount, wallet: session.wallet, game: "hilocard" 
        };
        if (finalStatus === "lose") phpPayload.status = "lose";
        else phpPayload.status = "win";

        phpPayload.bet_amount = session.reqAmount;

        // ৪. মেইন সাইটের গেটওয়েতে রিয়েল-টাইম উইন-লস সেটেলমেন্ট এপিআই হিট (কড়া ৪৫ সেকেন্ড সিঙ্ক লক)
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, phpPayload, { timeout: 45000 });

        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            
            let finalOutput = {
                success: true,
                balance: response.data.balance,
                data: { balance: response.data.balance },
                status: finalStatus,
                winAmount: winAmount,
                result: reasonStr,
                gameData: {
                    prevCard: session.currentCard,
                    nextCard: nextCard,
                    status: finalStatus,
                    winAmount: winAmount,
                    result: reasonStr
                }
            };
            delete activeHiLoSessions[userId]; // মেমরির সেশন টোকেন ফ্রেশ ক্লিনআপ
            return res.json(finalOutput);
        } else {
            return res.json({ success: false, balance: session.currentDbBalance, message: "X Bet Settlement Declined by Database!" });
        }
    } catch (err) {
        return res.json({ success: false, message: "⚠️ Timeout! Processing fault on server bridge." });
    }
});

app.get('/', (req, res) => { res.sendFile(path.resolve(__dirname, 'index.html')); });
io.on('connection', (socket) => {});

// ⚡ কাস্টম হাই-লো কার্ড নোড সার্ভার পোর্ট গেটওয়ে লাইভ অন ফায়ার
const PORT = process.env.PORT || 20000; // 🎯 হাই-লো কার্ডের জন্য ডেডিকেটেড পোর্ট ২৬০০০ লক ভাই ভাই
server.listen(PORT, () => { console.log(`🎡 Hi-Lo Card Engine Running on port ${PORT}`); });
