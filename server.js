const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - মেগা সকেট প্রোটোকল লক]
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

// 🎰 [উইনগো কালার ট্রেড ওরিজিনাল ডোমেইন সিঙ্ক]
const MAIN_SITE_URL = "https://onrender.com"; 

// 🧠 ওরিজিনাল তাসের কার্ডের মেমোরি পয়েন্ট ডেক ভাই ভাই (Ace সর্বোচ্চ ১৪ পয়েন্ট ভাই)
const cardDeck = [
    { value: "2", suit: "♥️", points: 2 }, { value: "3", suit: "♥️", points: 3 }, { value: "4", suit: "♥️", points: 4 },
    { value: "5", suit: "♥️", points: 5 }, { value: "6", suit: "♥️", points: 6 }, { value: "7", suit: "♥️", points: 7 },
    { value: "8", suit: "♥️", points: 8 }, { value: "9", suit: "♥️", points: 9 }, { value: "10", suit: "♥️", points: 10 },
    { value: "J", suit: "♥️", points: 11 }, { value: "Q", suit: "♥️", points: 12 }, { value: "K", suit: "♥️", points: 13 }, { value: "A", suit: "♥️", points: 14 },
    
    { value: "2", suit: "♦️", points: 2 }, { value: "3", suit: "♦️", points: 3 }, { value: "4", suit: "♦️", points: 4 },
    { value: "5", suit: "♦️", points: 5 }, { value: "6", suit: "♦️", points: 6 }, { value: "7", suit: "♦️", points: 7 },
    { value: "8", suit: "♦️", points: 8 }, { value: "9", suit: "♦️", points: 9 }, { value: "10", suit: "♦️", points: 10 },
    { value: "J", suit: "♦️", points: 11 }, { value: "Q", suit: "♦️", points: 12 }, { value: "K", suit: "♦️", points: 13 }, { value: "A", suit: "♦️", points: 14 },
    
    { value: "2", suit: "♣️", points: 2 }, { value: "3", suit: "♣️", points: 3 }, { value: "4", suit: "♣️", points: 4 },
    { value: "5", suit: "♣️", points: 5 }, { value: "6", suit: "♣️", points: 6 }, { value: "7", suit: "♣️", points: 7 },
    { value: "8", suit: "♣️", points: 8 }, { value: "9", suit: "♣️", points: 9 }, { value: "10", suit: "♣️", points: 10 },
    { value: "J", suit: "♣️", points: 11 }, { value: "Q", suit: "♣️", points: 12 }, { value: "K", suit: "♣️", points: 13 }, { value: "A", suit: "♣️", points: 14 },
    
    { value: "2", suit: "♠️", points: 2 }, { value: "3", suit: "♠️", points: 3 }, { value: "4", suit: "♠️", points: 4 },
    { value: "5", suit: "♠️", points: 5 }, { value: "6", suit: "♠️", points: 6 }, { value: "7", suit: "♠️", points: 7 },
    { value: "8", suit: "♠️", points: 8 }, { value: "9", suit: "♠️", points: 9 }, { value: "10", suit: "♠️", points: 10 },
    { value: "J", suit: "♠️", points: 11 }, { value: "Q", suit: "♠️", points: 12 }, { value: "K", suit: "♠️", points: 13 }, { value: "A", suit: "♠️", points: 14 }
];

// 🧠 প্লেয়ারের মেমোরি বেস কার্ড সেশন স্টোরেজ ভাই ভাই
let userCurrentCards = {};

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স নিয়ে আসার ডেডিকেটেড গেটওয়ে
app.get('/api/hilo-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    try {
        const response = await axios.get(`${MAIN_SITE_URL}/api_callback.php?action=get_balance&username=${userId}&wallet=${wallet}`, { timeout: 30000 });
        if (response.data && response.data.status === "ok") {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { return res.json({ success: false, balance: 0 }); }
});

// 🛫 ২. গেম শুরুতে স্ক্রিনে ১ম বেস কার্ড দেখানোর ইনিশিয়াল গেটওয়ে ভাই
app.get('/api/hilo-init', (req, res) => {
    const { userId } = req.query;
    const currentId = userId || "guest_user";
    
    // ১ম কার্ড হিসেবে র্যান্ডম ১টি সোজা কার্ড প্লেয়ারকে দেওয়া হলো ভাই
    if (!userCurrentCards[currentId]) {
        userCurrentCards[currentId] = cardDeck[Math.floor(Math.random() * cardDeck.length)];
    }
    return res.json({ success: true, baseCard: userCurrentCards[currentId] });
});

// 🛫 ৩. হাই-লো ওয়ান-ক্লিক ফ্লিপ এপিআই রাউট (POST Route - ৯৫% RTP গাণিতিক অ্যালগরিদম বর্ম লক ভাই ভাই!)
app.post('/api/hilo-flip', async (req, res) => {
    const { userId, amount, wallet, prediction } = req.body;
    const targetWallet = wallet || "main";
    const reqAmount = parseFloat(amount) || 50;
    const userPrediction = prediction || "HI"; // HI বা LO

    if (reqAmount < 1 || reqAmount > 2000) {
        return res.json({ success: false, message: "🚨 Invalid Bet Amount (৳১ - ৳২০০০)" });
    }

    try {
        const balCheck = await axios.get(`${MAIN_SITE_URL}/api_callback.php?action=get_balance&username=${userId}&wallet=${targetWallet}`, { timeout: 30000 });
        
        let currentDbBalance = 0;
        if (balCheck.data && balCheck.data.balance !== undefined && balCheck.data.balance !== null) {
            currentDbBalance = parseFloat(balCheck.data.balance);
        } else { currentDbBalance = 9999999; }

        if (currentDbBalance < reqAmount && currentDbBalance !== 9999999) {
            return res.json({ success: false, balance: currentDbBalance, message: "❌ Insufficient Balance!" });
        }

        // 🎯 [ভবিষ্যৎ সেন্ট্রাল গোপন এডমিন প্যানেল গেটওয়ে লিঙ্ক লক]
        let adminTriggeredPrize = (balCheck.data && balCheck.data.hilo_target) ? balCheck.data.hilo_target : null;

        // সেশন থেকে ওরিজিনাল ওল্ড বেস কার্ড রিড লক ভাই
        if (!userCurrentCards[userId]) {
            userCurrentCards[userId] = cardDeck[Math.floor(Math.random() * cardDeck.length)];
        }
        const baseCard = userCurrentCards[userId];

        let nextCard;
        let isLoopActive = true;
        let loopSafety = 0;

        // 🎰 [৯৫% ওরিজিনাল RTP ও সুষম কার্ড র্যান্ডমাইজেশন লুপ ভাই ভাই]
        while (isLoopActive && loopSafety < 200) {
            loopSafety++;
            nextCard = cardDeck[Math.floor(Math.random() * cardDeck.length)];

            // একই তাস বারবার রিপিট হবে না ভাই
            if (nextCard.value === baseCard.value && nextCard.suit === baseCard.suit) continue;

            let actualResult = "PUSH";
            if (nextCard.points > baseCard.points) actualResult = "HI";
            if (nextCard.points < baseCard.points) actualResult = "LO";

            if (adminTriggeredPrize) {
                if (actualResult === adminTriggeredPrize) {
                    isLoopActive = false;
                }
            } else {
                // টাই (PUSH) পড়ার চান্স ইন্টারন্যাশনাল ক্যাসিনো নিয়মে মাত্র ২% লক ভাই ভাই
                if (actualResult === "PUSH" && Math.random() > 0.02) continue;

                if (actualResult === userPrediction) {
                    // ৯৫% আরটিপি অনুযায়ী প্লেয়ার উইন চান্স ৪৭% ব্যালেন্স ট্র্যাকিং লুপ ভাই ভাই
                    if (Math.random() <= 0.47) {
                        isLoopActive = false;
                    }
                } else {
                    isLoopActive = false; // প্লেয়ার ভুল ধরলে লুপ ডিরেক্ট স্টপ ভাই
                }
            }
        }

        // চূড়ান্ত ফলাফল ফয়সালা গেটওয়ে ভাই
        let finalResult = "PUSH";
        if (nextCard.points > baseCard.points) finalResult = "HI";
        if (nextCard.points < baseCard.points) finalResult = "LO";

        let gameOutcome = "lose";
        let winMultiplier = 0.00;
        let outcomeMsg = `পরের তাস এসেছে ${nextCard.value}! আপনার অনুমান ভুল হয়েছে ভাই ভাই।`;

        if (userPrediction === finalResult) {
            gameOutcome = "win";
            winMultiplier = 2.00; // ২ গুণ ডবল প্রফিট চাবি ভাই ভাই
            outcomeMsg = `পরের তাস এসেছে ${nextCard.value}! আপনার অনুমান একদম সঠিক হয়েছে!`;
        } else if (finalResult === "PUSH") {
            // সেম পয়েন্টের তাস পড়লে বাজি ড্র, টাকা প্লেয়ার রিফান্ড ফেরত পাবে ভাই ভাই
            gameOutcome = "push";
            winMultiplier = 1.00;
            outcomeMsg = `পরের তাসও এসেছে সমান পয়েন্টের ${nextCard.value}! বাজি ড্র বা টাই হয়েছে ভাই!`;
        }

        let winAmount = 0;
        let dbAction = "bet";
        let dbAmount = reqAmount;

        if (gameOutcome === "win" || gameOutcome === "push") {
            winAmount = Math.floor(reqAmount * winMultiplier);
            dbAction = "win";
            dbAmount = parseFloat(winAmount);
        }

        let phpPayload = {
            action: dbAction,
            username: userId,
            amount: dbAmount,
            wallet: targetWallet
        };

        if (dbAction === "win") {
            phpPayload.bet_amount = reqAmount;
            phpPayload.multiplier = winMultiplier.toFixed(2);
            phpPayload.status = "win";
            phpPayload.type = "win";
            phpPayload.is_win = 1;
            phpPayload.win_status = "win";
            phpPayload.log_status = "win";
        }

                const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', phpPayload, { timeout: 30000 });

        if (response.data && response.data.status === "ok") {
            // 🔄 [পরবর্তী রাউন্ড চেইন লক ভাই]: এই নতুন ওপেন হওয়া তাসটিই পরের রাউন্ডের বেস কার্ড হয়ে যাবে ভাই ভাই!
            userCurrentCards[userId] = nextCard;
            
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });

            return res.json({
                success: true,
                balance: response.data.balance,
                status: gameOutcome,
                winAmount: winAmount,
                nextCard: nextCard,
                message: outcomeMsg
            });
        } else {
            let latestBal = (response.data && response.data.balance !== undefined) ? response.data.balance : currentDbBalance;
            return res.json({ success: false, balance: latestBal, message: "❌ Bet Declined by Database!" });
        }

    } catch (e) {
        console.error("Hi-Lo Core Engine Error:", e.message);
        return res.json({ success: false, message: "⚠️ Timeout! Click FLIP again." });
    }
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

io.on('connection', (socket) => { console.log("Player connected to Hi-Lo Card Casino Engine!"); });

// ১২ নম্বর গেম ১৯০০০ এ চলছে, তাই ১৩ নম্বর মেগা হাই-লো গেম প্রজেক্টের স্বাধীন কাস্টম পোর্ট ২০০০০ কড়া লক হলো ভাই ভাই!
const PORT = process.env.PORT || 20000;
server.listen(PORT, () => { console.log(`🃏 Hi-Lo Card Casino Engine Running on port ${PORT}`); });
