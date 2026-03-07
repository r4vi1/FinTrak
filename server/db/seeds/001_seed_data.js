const bcrypt = require('bcryptjs');

/**
 * Realistic seed data for FinTrak
 * Generates ~6 months of transactions across multiple accounts
 * with recognizable Indian merchants and spending patterns.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
    // Clear existing data (reverse FK order)
    await knex('transaction_categories').del();
    await knex('category_rules').del();
    await knex('categories').del();
    await knex('transactions').del();
    await knex('accounts').del();
    await knex('users').del();

    // ── User ────────────────────────────────────────────
    const [user] = await knex('users').insert({
        email: 'ravi@fintrak.dev',
        name: 'Ravi Varma',
        password_hash: await bcrypt.hash('demo1234', 10),
        currency: 'INR',
    }).returning('id');

    const userId = typeof user === 'object' ? user.id : user;

    // ── Accounts ────────────────────────────────────────
    const accountsData = [
        { user_id: userId, name: 'HDFC Savings', type: 'savings', institution: 'HDFC Bank', account_number_masked: 'XXXX4521', balance: 245680.50, color: '#3b82f6', icon: 'bank' },
        { user_id: userId, name: 'SBI Salary Account', type: 'savings', institution: 'State Bank of India', account_number_masked: 'XXXX8834', balance: 189320.00, color: '#22c55e', icon: 'bank' },
        { user_id: userId, name: 'ICICI Current', type: 'current', institution: 'ICICI Bank', account_number_masked: 'XXXX7712', balance: 78450.75, color: '#f59e0b', icon: 'briefcase' },
        { user_id: userId, name: 'HDFC Credit Card', type: 'credit_card', institution: 'HDFC Bank', account_number_masked: 'XXXX9901', balance: -32450.00, credit_limit: 300000, color: '#ef4444', icon: 'credit-card' },
        { user_id: userId, name: 'Axis Credit Card', type: 'credit_card', institution: 'Axis Bank', account_number_masked: 'XXXX5567', balance: -18720.00, credit_limit: 200000, color: '#a855f7', icon: 'credit-card' },
    ];

    const accountIds = await knex('accounts').insert(accountsData).returning('id');
    const accts = accountIds.map((a) => (typeof a === 'object' ? a.id : a));
    const [hdfc, sbi, icici, hdfcCC, axisCC] = accts;

    // ── Merchant & Transaction Templates ───────────────

    const merchantProfiles = {
        // Food & Dining
        'Zomato': { amountRange: [150, 1200], mode: 'upi', freq: 8, rawCat: 'Food & Dining' },
        'Swiggy': { amountRange: [100, 900], mode: 'upi', freq: 7, rawCat: 'Food & Dining' },
        'Starbucks': { amountRange: [350, 750], mode: 'card', freq: 3, rawCat: 'Food & Dining' },
        'Chai Point': { amountRange: [80, 250], mode: 'upi', freq: 5, rawCat: 'Food & Dining' },

        // Shopping
        'Amazon': { amountRange: [200, 15000], mode: 'card', freq: 4, rawCat: 'Shopping' },
        'Flipkart': { amountRange: [300, 12000], mode: 'card', freq: 2, rawCat: 'Shopping' },
        'Myntra': { amountRange: [500, 6000], mode: 'card', freq: 2, rawCat: 'Shopping' },
        'Reliance Digital': { amountRange: [1000, 25000], mode: 'card', freq: 1, rawCat: 'Shopping' },

        // Transport
        'Uber': { amountRange: [120, 800], mode: 'upi', freq: 6, rawCat: 'Transport' },
        'Ola': { amountRange: [100, 700], mode: 'upi', freq: 4, rawCat: 'Transport' },
        'Indian Oil': { amountRange: [1500, 4500], mode: 'card', freq: 2, rawCat: 'Fuel' },
        'Metro Recharge': { amountRange: [200, 500], mode: 'upi', freq: 3, rawCat: 'Transport' },

        // Groceries
        'BigBasket': { amountRange: [800, 4000], mode: 'upi', freq: 3, rawCat: 'Groceries' },
        'Zepto': { amountRange: [150, 1500], mode: 'upi', freq: 5, rawCat: 'Groceries' },
        'DMart': { amountRange: [1200, 5000], mode: 'card', freq: 2, rawCat: 'Groceries' },

        // Subscriptions
        'Netflix': { amountRange: [199, 649], mode: 'auto_debit', freq: 1, rawCat: 'Subscriptions', recurring: true },
        'Spotify': { amountRange: [119, 179], mode: 'auto_debit', freq: 1, rawCat: 'Subscriptions', recurring: true },
        'YouTube Premium': { amountRange: [129, 189], mode: 'auto_debit', freq: 1, rawCat: 'Subscriptions', recurring: true },
        'iCloud': { amountRange: [75, 75], mode: 'auto_debit', freq: 1, rawCat: 'Subscriptions', recurring: true },
        'Jio': { amountRange: [239, 666], mode: 'auto_debit', freq: 1, rawCat: 'Telecom', recurring: true },

        // Utilities & Bills
        'BESCOM': { amountRange: [800, 3500], mode: 'auto_debit', freq: 1, rawCat: 'Utilities', recurring: true },
        'BWSSB': { amountRange: [300, 800], mode: 'auto_debit', freq: 1, rawCat: 'Utilities', recurring: true },
        'Piped Gas': { amountRange: [400, 900], mode: 'auto_debit', freq: 1, rawCat: 'Utilities', recurring: true },

        // Health & Fitness
        'Decathlon': { amountRange: [500, 5000], mode: 'card', freq: 1, rawCat: 'Health & Fitness' },
        'Cult.fit': { amountRange: [600, 2500], mode: 'upi', freq: 1, rawCat: 'Health & Fitness' },
        'Apollo Pharmacy': { amountRange: [200, 2000], mode: 'upi', freq: 1, rawCat: 'Health' },

        // Entertainment
        'BookMyShow': { amountRange: [200, 1500], mode: 'upi', freq: 2, rawCat: 'Entertainment' },
        'PVR Cinemas': { amountRange: [300, 1200], mode: 'card', freq: 1, rawCat: 'Entertainment' },

        // Education
        'Udemy': { amountRange: [449, 3499], mode: 'card', freq: 1, rawCat: 'Education' },

        // Rent & EMI
        'Rent - Flat': { amountRange: [25000, 25000], mode: 'neft', freq: 1, rawCat: 'Rent', recurring: true },
    };

    // Accounts from which each merchant typically draws
    const merchantAccounts = {
        'Zomato': [hdfc, hdfcCC, axisCC],
        'Swiggy': [hdfc, sbi, hdfcCC],
        'Starbucks': [hdfcCC, axisCC],
        'Chai Point': [hdfc, sbi],
        'Amazon': [hdfcCC, axisCC],
        'Flipkart': [hdfcCC, axisCC],
        'Myntra': [axisCC],
        'Reliance Digital': [hdfcCC],
        'Uber': [hdfc, sbi],
        'Ola': [hdfc, sbi],
        'Indian Oil': [hdfcCC],
        'Metro Recharge': [hdfc],
        'BigBasket': [hdfc, sbi],
        'Zepto': [hdfc, sbi, hdfcCC],
        'DMart': [hdfcCC],
        'Netflix': [hdfcCC],
        'Spotify': [axisCC],
        'YouTube Premium': [hdfcCC],
        'iCloud': [axisCC],
        'Jio': [hdfc],
        'BESCOM': [hdfc],
        'BWSSB': [hdfc],
        'Piped Gas': [hdfc],
        'Decathlon': [hdfcCC],
        'Cult.fit': [hdfc],
        'Apollo Pharmacy': [hdfc, sbi],
        'BookMyShow': [hdfc, axisCC],
        'PVR Cinemas': [hdfcCC],
        'Udemy': [hdfcCC],
        'Rent - Flat': [sbi],
    };

    // Income sources
    const incomeProfiles = [
        { merchant: 'Employer - TechCorp', amount: 185000, account: sbi, mode: 'neft', desc: 'Monthly Salary', day: 1 },
        { merchant: 'Freelance - Design Co', amount: 35000, account: hdfc, mode: 'imps', desc: 'Freelance Payment', dayRange: [5, 15] },
    ];

    // ── Generate Transactions ──────────────────────────

    const transactions = [];
    const now = new Date('2026-03-07');

    // Go back 6 months
    for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
        const year = now.getFullYear();
        const month = now.getMonth() - monthsAgo;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // last day of month
        const daysInMonth = endDate.getDate();

        // ── Income ──
        for (const income of incomeProfiles) {
            const day = income.day || randomInt(income.dayRange[0], income.dayRange[1]);
            if (day <= daysInMonth) {
                transactions.push({
                    account_id: income.account,
                    date: formatDate(new Date(year, month, day)),
                    amount: income.amount + (income.dayRange ? randomInt(-5000, 5000) : 0),
                    type: 'credit',
                    merchant: income.merchant,
                    description: income.desc,
                    raw_category: 'Income',
                    payment_mode: income.mode,
                    is_recurring: true,
                });
            }
        }

        // ── Expenses ──
        for (const [merchant, profile] of Object.entries(merchantProfiles)) {
            const timesThisMonth = profile.recurring
                ? 1
                : randomInt(Math.max(0, profile.freq - 1), profile.freq + 1);

            for (let i = 0; i < timesThisMonth; i++) {
                const day = profile.recurring
                    ? randomInt(1, 5)                           // Recurring tends to hit early in month
                    : randomInt(1, daysInMonth);
                const accounts = merchantAccounts[merchant] || [hdfc];
                const account = accounts[randomInt(0, accounts.length - 1)];
                const amount = randomDecimal(profile.amountRange[0], profile.amountRange[1]);

                transactions.push({
                    account_id: account,
                    date: formatDate(new Date(year, month, Math.min(day, daysInMonth))),
                    amount,
                    type: 'debit',
                    merchant,
                    description: `${merchant} - ${profile.rawCat}`,
                    raw_category: profile.rawCat,
                    payment_mode: profile.mode,
                    is_recurring: profile.recurring || false,
                });
            }
        }
    }

    // Sort by date
    transactions.sort((a, b) => a.date.localeCompare(b.date));

    // Insert in batches to avoid SQLite limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
        await knex('transactions').insert(transactions.slice(i, i + BATCH_SIZE));
    }

    // ── Categories (system defaults) ───────────────────

    const categoriesData = [
        { user_id: userId, name: 'Food & Dining', color: '#f97316', icon: 'utensils', is_system: true, sort_order: 1 },
        { user_id: userId, name: 'Shopping', color: '#ec4899', icon: 'shopping-bag', is_system: true, sort_order: 2 },
        { user_id: userId, name: 'Transport', color: '#06b6d4', icon: 'car', is_system: true, sort_order: 3 },
        { user_id: userId, name: 'Groceries', color: '#22c55e', icon: 'shopping-cart', is_system: true, sort_order: 4 },
        { user_id: userId, name: 'Subscriptions', color: '#a855f7', icon: 'repeat', is_system: true, sort_order: 5 },
        { user_id: userId, name: 'Utilities', color: '#eab308', icon: 'zap', is_system: true, sort_order: 6 },
        { user_id: userId, name: 'Entertainment', color: '#f43f5e', icon: 'film', is_system: true, sort_order: 7 },
        { user_id: userId, name: 'Health & Fitness', color: '#14b8a6', icon: 'heart', is_system: true, sort_order: 8 },
        { user_id: userId, name: 'Rent', color: '#64748b', icon: 'home', is_system: true, sort_order: 9 },
        { user_id: userId, name: 'Income', color: '#10b981', icon: 'trending-up', is_system: true, sort_order: 10 },
        // ── Custom user categories (the differentiator!) ──
        { user_id: userId, name: 'Zomato', color: '#e23744', icon: 'utensils', is_system: false, sort_order: 11 },
        { user_id: userId, name: 'Amazon', color: '#ff9900', icon: 'package', is_system: false, sort_order: 12 },
    ];

    const catIds = await knex('categories').insert(categoriesData).returning('id');
    const cats = catIds.map((c) => (typeof c === 'object' ? c.id : c));

    // ── Category Rules ────────────────────────────────

    const rulesData = [
        // System category rules
        { category_id: cats[0], match_type: 'keyword', match_field: 'raw_category', match_value: 'Food & Dining' },
        { category_id: cats[1], match_type: 'keyword', match_field: 'raw_category', match_value: 'Shopping' },
        { category_id: cats[2], match_type: 'keyword', match_field: 'raw_category', match_value: 'Transport' },
        { category_id: cats[2], match_type: 'keyword', match_field: 'raw_category', match_value: 'Fuel' },
        { category_id: cats[3], match_type: 'keyword', match_field: 'raw_category', match_value: 'Groceries' },
        { category_id: cats[4], match_type: 'keyword', match_field: 'raw_category', match_value: 'Subscriptions' },
        { category_id: cats[4], match_type: 'keyword', match_field: 'raw_category', match_value: 'Telecom' },
        { category_id: cats[5], match_type: 'keyword', match_field: 'raw_category', match_value: 'Utilities' },
        { category_id: cats[6], match_type: 'keyword', match_field: 'raw_category', match_value: 'Entertainment' },
        { category_id: cats[7], match_type: 'keyword', match_field: 'raw_category', match_value: 'Health' },
        { category_id: cats[7], match_type: 'keyword', match_field: 'raw_category', match_value: 'Health & Fitness' },
        { category_id: cats[8], match_type: 'keyword', match_field: 'raw_category', match_value: 'Rent' },
        { category_id: cats[9], match_type: 'keyword', match_field: 'raw_category', match_value: 'Income' },
        // Custom cross-account rules
        { category_id: cats[10], match_type: 'keyword', match_field: 'merchant', match_value: 'Zomato' },
        { category_id: cats[11], match_type: 'keyword', match_field: 'merchant', match_value: 'Amazon' },
    ];

    await knex('category_rules').insert(rulesData);

    // ── Auto-tag transactions ─────────────────────────

    const allTransactions = await knex('transactions').select('id', 'merchant', 'description', 'raw_category');
    const allRules = await knex('category_rules').select('*');

    const taggings = [];
    for (const txn of allTransactions) {
        for (const rule of allRules) {
            const fieldValue = txn[rule.match_field] || '';
            let matched = false;

            if (rule.match_type === 'exact') {
                matched = rule.case_sensitive
                    ? fieldValue === rule.match_value
                    : fieldValue.toLowerCase() === rule.match_value.toLowerCase();
            } else if (rule.match_type === 'keyword') {
                matched = rule.case_sensitive
                    ? fieldValue.includes(rule.match_value)
                    : fieldValue.toLowerCase().includes(rule.match_value.toLowerCase());
            } else if (rule.match_type === 'regex') {
                try {
                    const flags = rule.case_sensitive ? '' : 'i';
                    matched = new RegExp(rule.match_value, flags).test(fieldValue);
                } catch { /* invalid regex, skip */ }
            }

            if (matched) {
                taggings.push({
                    transaction_id: txn.id,
                    category_id: rule.category_id,
                    is_auto: true,
                });
            }
        }
    }

    // De-duplicate (same txn+category pair)
    const seen = new Set();
    const uniqueTaggings = taggings.filter((t) => {
        const key = `${t.transaction_id}-${t.category_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    for (let i = 0; i < uniqueTaggings.length; i += BATCH_SIZE) {
        await knex('transaction_categories').insert(uniqueTaggings.slice(i, i + BATCH_SIZE));
    }

    console.log(`✅ Seeded: 1 user, ${accts.length} accounts, ${transactions.length} transactions, ${categoriesData.length} categories, ${rulesData.length} rules, ${uniqueTaggings.length} auto-tags`);
};

// ── Helpers ─────────────────────────────────────────

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min, max) {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}
