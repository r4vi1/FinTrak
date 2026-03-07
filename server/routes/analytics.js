const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/analytics/cashflow ──────────────────────
// Monthly inflow vs outflow over time
router.get('/cashflow', async (req, res, next) => {
    try {
        const userId = req.query.user_id || 1;
        const months = parseInt(req.query.months) || 6;

        const userAccounts = await db('accounts').where('user_id', userId).select('id');
        const accountIds = userAccounts.map((a) => a.id);

        const cashflow = await db('transactions')
            .whereIn('account_id', accountIds)
            .where('is_excluded', false)
            .select(
                db.raw("strftime('%Y-%m', date) as month"),
            )
            .sum({ inflow: db.raw("CASE WHEN type = 'credit' THEN amount ELSE 0 END") })
            .sum({ outflow: db.raw("CASE WHEN type = 'debit' THEN amount ELSE 0 END") })
            .count({ transaction_count: '*' })
            .groupBy('month')
            .orderBy('month', 'desc')
            .limit(months);

        const data = cashflow.reverse().map((row) => ({
            month: row.month,
            inflow: parseFloat(row.inflow) || 0,
            outflow: parseFloat(row.outflow) || 0,
            net: (parseFloat(row.inflow) || 0) - (parseFloat(row.outflow) || 0),
            transaction_count: row.transaction_count,
        }));

        res.json({ cashflow: data });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/analytics/spending-by-category ──────────
// Category-wise spending breakdown for a given period
router.get('/spending-by-category', async (req, res, next) => {
    try {
        const userId = req.query.user_id || 1;
        const { date_from, date_to } = req.query;

        let query = db('transaction_categories')
            .join('transactions', 'transaction_categories.transaction_id', 'transactions.id')
            .join('categories', 'transaction_categories.category_id', 'categories.id')
            .join('accounts', 'transactions.account_id', 'accounts.id')
            .where('accounts.user_id', userId)
            .where('transactions.type', 'debit')
            .where('transactions.is_excluded', false);

        if (date_from) query = query.where('transactions.date', '>=', date_from);
        if (date_to) query = query.where('transactions.date', '<=', date_to);

        const spending = await query
            .select(
                'categories.id',
                'categories.name',
                'categories.color',
                'categories.icon',
                'categories.is_system',
            )
            .sum({ total: 'transactions.amount' })
            .count({ count: '*' })
            .groupBy('categories.id')
            .orderBy('total', 'desc');

        const grandTotal = spending.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

        const data = spending.map((row) => ({
            id: row.id,
            name: row.name,
            color: row.color,
            icon: row.icon,
            is_system: row.is_system,
            total: parseFloat(row.total) || 0,
            count: row.count,
            percentage: grandTotal > 0 ? Math.round(((parseFloat(row.total) || 0) / grandTotal) * 10000) / 100 : 0,
        }));

        res.json({ spending: data, grand_total: grandTotal });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/analytics/top-merchants ─────────────────
// Top spending merchants across all accounts
router.get('/top-merchants', async (req, res, next) => {
    try {
        const userId = req.query.user_id || 1;
        const limit = parseInt(req.query.limit) || 10;

        const userAccounts = await db('accounts').where('user_id', userId).select('id');
        const accountIds = userAccounts.map((a) => a.id);

        const merchants = await db('transactions')
            .whereIn('account_id', accountIds)
            .where('type', 'debit')
            .where('is_excluded', false)
            .select('merchant')
            .sum({ total: 'amount' })
            .count({ count: '*' })
            .groupBy('merchant')
            .orderBy('total', 'desc')
            .limit(limit);

        res.json({
            merchants: merchants.map((m) => ({
                merchant: m.merchant,
                total: parseFloat(m.total) || 0,
                count: m.count,
            })),
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/analytics/daily-spending ────────────────
// Day-by-day spending for a given month
router.get('/daily-spending', async (req, res, next) => {
    try {
        const userId = req.query.user_id || 1;
        const month = req.query.month; // e.g. '2026-03'

        if (!month) return res.status(400).json({ error: 'month query param required (YYYY-MM)' });

        const userAccounts = await db('accounts').where('user_id', userId).select('id');
        const accountIds = userAccounts.map((a) => a.id);

        const daily = await db('transactions')
            .whereIn('account_id', accountIds)
            .where('type', 'debit')
            .where('is_excluded', false)
            .where('date', '>=', `${month}-01`)
            .where('date', '<', nextMonth(month))
            .select('date')
            .sum({ total: 'amount' })
            .count({ count: '*' })
            .groupBy('date')
            .orderBy('date', 'asc');

        res.json({
            daily: daily.map((d) => ({
                date: d.date,
                total: parseFloat(d.total) || 0,
                count: d.count,
            })),
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/analytics/recurring ─────────────────────
// List recurring expenses with monthly cost
router.get('/recurring', async (req, res, next) => {
    try {
        const userId = req.query.user_id || 1;

        const userAccounts = await db('accounts').where('user_id', userId).select('id');
        const accountIds = userAccounts.map((a) => a.id);

        const recurring = await db('transactions')
            .whereIn('account_id', accountIds)
            .where('is_recurring', true)
            .where('type', 'debit')
            .select('merchant')
            .avg({ avg_amount: 'amount' })
            .count({ months_seen: db.raw("DISTINCT strftime('%Y-%m', date)") })
            .sum({ total: 'amount' })
            .groupBy('merchant')
            .orderBy('avg_amount', 'desc');

        res.json({
            recurring: recurring.map((r) => ({
                merchant: r.merchant,
                avg_monthly: Math.round((parseFloat(r.avg_amount) || 0) * 100) / 100,
                months_seen: r.months_seen,
                total: parseFloat(r.total) || 0,
            })),
        });
    } catch (err) {
        next(err);
    }
});

// ── Helper ───────────────────────────────────────────
function nextMonth(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    const next = new Date(year, month, 1); // month is 0-indexed, so month (1-indexed) = next month
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
}

module.exports = router;
