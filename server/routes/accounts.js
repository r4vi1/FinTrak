const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/accounts ────────────────────────────────
// List all accounts (optionally filter by user_id)
router.get('/', async (req, res, next) => {
    try {
        const userId = req.query.user_id || 1; // Default to user 1 for now

        const accounts = await db('accounts')
            .where('user_id', userId)
            .where('is_active', true)
            .orderBy('created_at', 'asc');

        // Get transaction summary per account
        const summaries = await db('transactions')
            .whereIn('account_id', accounts.map((a) => a.id))
            .select('account_id')
            .sum({ total_credit: db.raw("CASE WHEN type = 'credit' THEN amount ELSE 0 END") })
            .sum({ total_debit: db.raw("CASE WHEN type = 'debit' THEN amount ELSE 0 END") })
            .count({ transaction_count: '*' })
            .groupBy('account_id');

        const summaryMap = {};
        summaries.forEach((s) => {
            summaryMap[s.account_id] = {
                total_credit: s.total_credit || 0,
                total_debit: s.total_debit || 0,
                transaction_count: s.transaction_count || 0,
            };
        });

        const enriched = accounts.map((a) => ({
            ...a,
            summary: summaryMap[a.id] || { total_credit: 0, total_debit: 0, transaction_count: 0 },
        }));

        res.json({ accounts: enriched });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/accounts/summary/net-worth ──────────────
// Total net worth across all accounts (MUST be before /:id)
router.get('/summary/net-worth', async (req, res, next) => {
    try {
        const userId = req.query.user_id || 1;
        const accounts = await db('accounts')
            .where('user_id', userId)
            .where('is_active', true)
            .select('balance', 'type');

        const netWorth = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);
        const totalSavings = accounts
            .filter((a) => ['savings', 'current'].includes(a.type))
            .reduce((sum, a) => sum + parseFloat(a.balance), 0);
        const totalDebt = accounts
            .filter((a) => a.type === 'credit_card' || a.type === 'loan')
            .reduce((sum, a) => sum + Math.abs(parseFloat(a.balance)), 0);

        res.json({ net_worth: netWorth, total_savings: totalSavings, total_debt: totalDebt });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/accounts/:id ────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const account = await db('accounts').where('id', req.params.id).first();
        if (!account) return res.status(404).json({ error: 'Account not found' });
        res.json({ account });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
