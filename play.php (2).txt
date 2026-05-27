<?php
ob_start();
session_start();
include 'db.php';

// ১. সেশন থেকে নিখুঁতভাবে ইউজার আইডি চেক
$u = $_SESSION['user_id'] ?? $_SESSION['username'] ?? '';
if (empty($u)) {
    header("Location: index.php");
    exit();
}

// ২. ডাটাবেজ থেকে রিয়েল-টাইমে ইউজারের ওয়ালেটের সর্বশেষ তথ্য আনা
$query = $conn->query("SELECT * FROM users WHERE username = '$u' OR id = '$u'");
$user_data = $query->fetch_assoc();
$aviator_base_url = "https://aviator2-0-azym.onrender.com";
$wingo_base_url = "https://color-trade.onrender.com";
$chicken_base_url = "https://chickenroad.onrender.com";
$slot_base_url = "https://lucky777-slot.onrender.com"; // ৪ নম্বর স্লট মাস্টার অনলাইন লিঙ্ক ভাই
$ace_base_url = "https://super-ace.onrender.com"; // ♠️ ৫ নম্বর প্রিমিয়াম সুপার এস অনলাইন লিঙ্ক ভাই
$ludu_base_url = "https://ludu777.onrender.com"; // 🎲 ৬ নম্বর লুডু গেমের রেন্ডার লাইভ লিংক ভাই

$active_wallet = isset($user_data['active_wallet']) ? $user_data['active_wallet'] : 'main';
$get_game_type = isset($_GET['game']) ? $_GET['game'] : '';
$game_user_id = !empty($u) ? $u : "guest";

if ($get_game_type === 'color' || $get_game_type === 'ColorTrade') {
    // 🎰 [কালার ট্রেড লিঙ্ক জ্যাম ফিক্স ভাই]: এবার 'color' বা 'ColorTrade' যেকোনো বানানে চাপ দিলে এভিয়েটরে না গিয়ে ডিরেক্ট কালার গেমেই ঢুকবে ভাই!
    $game_url = $wingo_base_url . "/?userId=" . $game_user_id . "&wallet=" . $active_wallet;
} else if ($get_game_type === 'chicken') {
    $game_url = $chicken_base_url . "/?userId=" . $game_user_id . "&wallet=" . $active_wallet;
} else if ($get_game_type === 'slotmaster') {
    $game_url = $slot_base_url . "/?userId=" . $game_user_id . "&wallet=" . $active_wallet;
} else if ($get_game_type === 'superace') {
    // ♠️ [৫ নম্বর JILI সুপার এস গেমের অফিশিয়াল লাইভ গেটওয়ে লক ভাই]
    $game_url = $ace_base_url . "/?userId=" . $game_user_id . "&wallet=" . $active_wallet;
} else {
    $game_url = $aviator_base_url . "/?userId=" . $game_user_id . "&wallet=" . $active_wallet;
}


?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Game Test - BetLover247</title>
    <style>
        body { margin: 0; padding: 0; background: #000; font-family: sans-serif; }
        
        /* 🕹️ গেম হেডার */
        .game-header {
            background: #000;
            height: 55px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 10px;
            border-bottom: 2px solid #00ff88;
            box-sizing: border-box;
        }
        
        .back-btn {
            background: #00ff88;
            color: #000;
            text-decoration: none;
            padding: 8px 12px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 12px;
        }
        
        .wallet-select {
            background: #111;
            color: #ffdf1b;
            border: 1px solid #333;
            padding: 8px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 14px;
            flex-grow: 1;
            margin: 0 10px;
            outline: none;
        }
        
        .history-btn {
            color: #00ff88;
            text-decoration: none;
            font-size: 13px;
            font-weight: bold;
            background: #111;
            padding: 8px 12px;
            border-radius: 5px;
            border: 1px solid #333;
        }
        
        /* 🎰 গেম এরিয়া */
        .game-container {
            width: 100%;
            height: calc(100vh - 55px);
            background: #111;
        }
        
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>

<div class="game-header">
    <a href="index.php" class="back-btn">BACK</a>
    
    <!-- 🎯 ওয়ালেট সিলেকশন ড্রপডাউন -->
    <select id="active_wallet" class="wallet-select" onchange="updateWallet(this.value)">
        <option value="main" <?php if($active_wallet == 'main') echo 'selected'; ?>>Main: ৳<?php echo number_format($user_data['balance'], 2); ?></option>
        <option value="pb" <?php if($active_wallet == 'pb') echo 'selected'; ?>>PB: ৳<?php echo number_format($user_data['pb_balance'], 2); ?></option>
        <option value="bonus" <?php if($active_wallet == 'bonus') echo 'selected'; ?>>Bonus: ৳<?php echo number_format($user_data['bonus_balance'], 2); ?></option>
    </select>

    <a href="bet_logs.php" class="history-btn">HISTORY</a>
</div>

<div class="game-container">
    <!-- 🎯 এভিয়েটর গেম লোড আইফ্রেম -->
    <iframe src="<?php echo $game_url; ?>" id="game_frame" allow="autoplay; fullscreen; gaming"></iframe>
</div>

<script>
// ১. ওয়ালেট সিলেকশন রিফ্রেশার
function updateWallet(walletType) {
    fetch('update_wallet.php?type=' + walletType)
    .then(() => {
        location.reload();
    });
}

// 🎯 ২. ইউনিভার্সাল রিফ্রেশ-মুক্ত ব্যালেন্স সিঙ্ক (যা সাথে সাথে ওপরের ব্যালেন্স আপডেট করবে)
window.addEventListener("message", function(event) {
    if (event.data && event.data.action === "refresh_wallet") {
        fetch(window.location.href)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 🎯 থিমের সম্ভাব্য সব ব্যালেন্স আইডি ও ড্রপডাউন কন্টেইনার এক ক্লিকে লাইভ সিঙ্ক করার মেকানিজম
            const selectors = ['#active_wallet', '#balance', '#main-balance', '.user-balance', '.balance-amount', '[id*="balance"]'];

            selectors.forEach(selector => {
                const newEl = doc.querySelector(selector);
                const currentEl = document.querySelector(selector);
                if (newEl && currentEl) {
                    currentEl.innerHTML = newEl.innerHTML;
                }
            });
        });
    }
});
</script>
</body>
</html>
