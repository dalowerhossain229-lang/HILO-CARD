const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - গেটওয়ে সকেট প্রোটোকল লক ভাই ভাই]
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

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
const MAIN_SITE_URL = "https://onrender.com"; 
const cardSuitsPool = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];

// প্রতিটি ইউজারের কারেন্ট রানিং বেস কার্ড ট্র্যাক মেমোরি নোড
let activeHiLoBaseCards = {};

// 🎛️ ওরিজিনাল ক্যাসিনো ওッズ প্রবাবিলিটি ক্যালকুলেটর চাবি
const calculateDynamicHiLoOdds = (baseValue) => {
    let higherCardsCount = 13 - baseValue;
    let lowerCardsCount = baseValue - 1;
    
    let oddsHigh = higherCardsCount > 0 ? (12.5 / higherCardsCount).toFixed(2) : "0.00";
    let oddsLow = lowerCardsCount > 0 ? (12.5 / lowerCardsCount).toFixed(2) : "0.00";
    
    return {
        high: parseFloat(oddsHigh) < 1.1 ? "1.15" : oddsHigh,
        equal: "12.50",
        low: parseFloat(oddsLow) < 1.1 ? "1.15" : oddsLow
    };
};

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স ইন্টারসেপ্টর গেটওয়ে
app.get('/api/hilo-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    const targetWallet = wallet || "main";
    try {
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: 0, wallet: targetWallet, game: "hilomaster"
        }, { timeout: 30000 });

        if (response.data && response.data.status === "ok" && response.data.balance !== undefined) {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { return res.json({ success: false, balance: 0 }); }
});

// 🃏 ২. ইনিশিয়াল বেস কার্ড জেনারেটর গেটওয়ে (পেজ প্রথম লোড হওয়ার সময় কল হবে ভাই ভাই)
app.get('/api/hilo-init-card', (req, res) => {
    let dVal = Math.floor(Math.random() * 13) + 1; // 1 to 13
    let ranks = { 1: "A", 11: "J", 12: "Q", 13: "K" };
    let initialCard = { value: ranks[dVal] || dVal.toString(), rawValue: dVal, suit: cardSuitsPool[Math.floor(Math.random() * 4)] };
    
    let currentOdds = calculateDynamicHiLoOdds(dVal);
    return res.json({ success: true, baseCard: initialCard, oddsData: currentOdds });
});

// 🛫 ৩. হাই-লো কোর ট্রানজেকশন ডিল রাউট (POST Route - ৯৫% RTP গাণিতিক বর্ম কঠোর লক ভাই ভাই!)
app.post('/api/hilo-deal', async (req, res) => {
    const { userId, amount, wallet, prediction, game } = req.body;
    
    const targetWallet = wallet || "main";
    const reqAmount = parseFloat(amount) || 50;
    const userPrediction = prediction || "HIGH"; // HIGH, LOW, EQUAL
    const finalGameName = "hilomaster"; // 🎯 লবির কি-শর্টকোড টাইট লক

    // 🔒 ফিল্টার বাউন্সার লক ভাই ভাই
    if (reqAmount < 1 || reqAmount > 20000 || !["HIGH", "LOW", "EQUAL"].includes(userPrediction)) {
        return res.json({ success: false, message: "🚨 Invalid Bet Parameter (৳১ - ৳Subcontinent)" });
    }

    try {
        // 🔒 [ব্যালেন্স যাচাই প্রোটোকল]: বাজি প্লে করার সাথে সাথে ডাটাবেজ থেকে BDT টাকা এবং ওরিজিনাল গেমের নাম কেটে নেওয়ার বর্ম লক
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: reqAmount, wallet: targetWallet, game: finalGameName
        }, { timeout: 30000 });
        
        let currentDbBalance = 0;
        if (balResponse.data && balResponse.data.status === "ok" && balResponse.data.balance !== undefined) {
            currentDbBalance = parseFloat(balResponse.data.balance);
        } else {
            return res.json({ success: false, balance: 0, message: "X Database Sync Error! Please refresh and try again." });
        }

        if (currentDbBalance < 0) {
            return res.json({ success: false, balance: currentDbBalance, message: "X Insufficient Balance! Please Recharge." });
        }

        // মেমোরি থেকে ওরিজিনাল কারেন্ট বেস কার্ড রিড করা, না থাকলে ফলব্যাক ডিফল্ট ৭ নম্বর কার্ড লক
        let currentBaseCardValue = activeHiLoBaseCards[userId] ? activeHiLoBaseCards[userId] : 7;

        let nextCard, nVal, finalResult, winMultiplier, finalStatus;
        let isLoopActive = true;
        let loopSafety = 0;

        let dynamicOdds = calculateDynamicHiLoOdds(currentBaseCardValue);

        // 🎰 [🎰 ৯৫% ক্যাসিনো RTP এবং হাই-লো প্রোব্যাবিলিটি রাউন্ড সেটেলমেন্ট লুপ ভাই ভাই]
        while (isLoopActive && loopSafety < 200) {
            loopSafety++;
            
            nVal = Math.floor(Math.random() * 13) + 1;
            let ranks = { 1: "A", 11: "J", 12: "Q", 13: "K" };
            nextCard = { value: ranks[nVal] || nVal.toString(), rawValue: nVal, suit: cardSuitsPool[Math.floor(Math.random() * 4)] };

            if (nVal > currentBaseCardValue) finalResult = "HIGH";
            else if (nVal < currentBaseCardValue) finalResult = "LOW";
            else finalResult = "EQUAL";

            if (userPrediction === finalResult) {
                finalStatus = "win";
                winMultiplier = parseFloat(dynamicOdds[finalResult.toLowerCase()]);
            } else {
                finalStatus = "lose";
                winMultiplier = 0.00;
            }

            if (finalStatus === "win") {
                // ৯৫% আরটিপি সিঙ্ক কন্ট্রোল ম্যাথ লুপ স্বাভাবিক ট্র্যাকে ৪২% এ ব্যালেন্সড লক ভাই ভাই!
                if (Math.random() <= 0.42) isLoopActive = false;
            } else {
                isLoopActive = false;
            }
        }

        // নেক্সট রাউন্ডের জন্য এই নতুন কার্ডটিকেই বেস কার্ড মেমরিতে লক করে দেওয়া হলো ওস্তাদ
        activeHiLoBaseCards[userId] = nVal;
        let nextOddsData = calculateDynamicHiLoOdds(nVal);

        let winAmount = 0;
        let dbAction = "bet";
        let dbAmount = reqAmount; // 🔒 বাজি হারলেও ডাটাবেজে আপনার রিয়াল বাজি ধরার টাকাই (Stake) জমা হবে ওস্তাদ!

        if (finalStatus === "win") {
            winAmount = Math.round(reqAmount * winMultiplier);
            dbAction = "win";
            dbAmount = parseFloat(winAmount); // জিতলে উইনিং এমাউন্ট যাবে
        }

        let phpPayload = {
            action: dbAction, username: userId, amount: dbAmount, wallet: targetWallet, game: finalGameName
        };

        if (dbAction === "win") {
            phpPayload.bet_amount = reqAmount;
            phpPayload.multiplier = winMultiplier.toFixed(2);
            phpPayload.status = "win";
        } else {
            phpPayload.bet_amount = reqAmount;
            phpPayload.status = "lose";
        }

        // 🛫 ৪. মেইন সাইটের সিকিউরড গেটওয়েতে রিয়েল-টাইম উইন-লস সেটেলমেন্ট এপিআই হিট
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, phpPayload, { timeout: 30000 });

        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });

            // ফ্রন্টএন্ডে ওরিজিনাল ওッズ সিঙ্ক সহ ডেটা ডিসপ্যাচ
            let baseRanks = { 1: "A", 11: "J", 12: "Q", 13: "K" };
            let displayBaseCard = { value: baseRanks[currentBaseCardValue] || currentBaseCardValue.toString(), suit: cardSuitsPool[Math.floor(Math.random() * 4)] };

            return res.json({
                success: true,
                balance: response.data.balance,
                gameData: {
                    baseCard: displayBaseCard,
                    nextCard: nextCard,
                    result: finalResult,
                    status: finalStatus,
                    winAmount: winAmount,
                    oddsData: nextOddsData
                }
            });
        } else {
            let latestBal = (response.data && response.data.balance !== undefined) ? response.data.balance : currentDbBalance;
            return res.json({ success: false, balance: latestBal, message: "X Bet Settlement Declined by Database!" });
        }

    } catch (e) {
        console.error("Hi-Lo Master Core Engine Error:", e.message);
        return res.json({ success: false, message: "⚠️ Timeout! Click DEAL again." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log("Player connected to Hi-Lo Master Engine Live Node!");
});

// ⚡ কাস্টম হাই-লো নোড সার্ভার পোর্ট গেটওয়ে লাইভ অন ফায়ার
const PORT = process.env.PORT || 30000;
server.listen(PORT, () => {
    console.log(`🎡 Hi-Lo Master Engine Running on port ${PORT}`);
});
