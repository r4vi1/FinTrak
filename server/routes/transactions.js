const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/transactions ────────────────────────────
// List transactions with powerful filtering
router.get('/', async (req, res, next) => {
    try {
        const {
            user_id = 1,
            account_id,
            category_id,
            type,             // 'credit' or 'debit'
            merchant,
            search,           // Search in merchant + description
            date_from,
            date_to,
            payment_mode,
            is_recurring,
            limit = 50,
            offset = 0,
            sort_by = 'date',
            sort_order = 'desc',
        } = req.query;

        // Base query: user's accounts
        const userAccounts = await db('accounts').where('user_id', user_id).select('id');
        const accountIds = userAccounts.map((a) => a.id);

        let query = db('transactions')
            .whereIn('transactions.account_id', accountIds)
            .where('transactions.is_excluded', false);

        // Filters
        if (account_id) query = query.where('transactions.account_id', account_id);
        if (type) query = query.where('transactions.type', type);
        if (merchant) query = query.where('transactions.merchant', 'like', `%${merchant}%`);
        if (payment_mode) query = query.where('transactions.payment_mode', payment_mode);
        if (is_recurring !== undefined) query = query.where('transactions.is_recurring', is_recurring === 'true');
        if (date_from) query = query.where('transactions.date', '>=', date_from);
        if (date_to) query = query.where('transactions.date', '<=', date_to);
        if (search) {
            query = query.where(function () {
                this.where('transactions.merchant', 'like', `%${search}%`)
                    .orWhere('transactions.description', 'like', `%${search}%`);
            });
        }

        // Category filter via join
        if (category_id) {
            query = query
                .join('transaction_categories as tc', 'transactions.id', 'tc.transaction_id')
                .where('tc.category_id', category_id);
        }

        // Count total before pagination
        const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();

        // Get paginated results
        const transactions = await query
            .select(
                'transactions.*',
            )
            .orderBy(`transactions.${sort_by}`, sort_order)
            .limit(parseInt(limit))
            .offset(parseInt(offset));

        const { total } = await countQuery;

        // Enrich with account info and categories
        const txnIds = transactions.map((t) => t.id);
        const txnAccIds = [...new Set(transactions.map((t) => t.account_id))];

        const accounts = await db('accounts').whereIn('id', txnAccIds).select('id', 'name', 'institution', 'type', 'color', 'icon');
        const accountMap = {};
        accounts.forEach((a) => { accountMap[a.id] = a; });

        const tags = await db('transaction_categories')
            .whereIn('transaction_id', txnIds)
            .join('categories', 'transaction_categories.category_id', 'categories.id')
            .select('transaction_categories.transaction_id', 'categories.id as cat_id', 'categories.name', 'categories.color', 'categories.icon');

        const tagMap = {};
        tags.forEach((t) => {
            if (!tagMap[t.transaction_id]) tagMap[t.transaction_id] = [];
            tagMap[t.transaction_id].push({ id: t.cat_id, name: t.name, color: t.color, icon: t.icon });
        });

        const enriched = transactions.map((t) => ({
            ...t,
            account: accountMap[t.account_id] || null,
            categories: tagMap[t.id] || [],
        }));

        res.json({
            transactions: enriched,
            pagination: {
                total: parseInt(total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: parseInt(offset) + parseInt(limit) < parseInt(total),
            },
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/transactions/:id ────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const txn = await db('transactions').where('id', req.params.id).first();
        if (!txn) return res.status(404).json({ error: 'Transaction not found' });

        const account = await db('accounts').where('id', txn.account_id).first();
        const categories = await db('transaction_categories')
            .where('transaction_id', txn.id)
            .join('categories', 'transaction_categories.category_id', 'categories.id')
            .select('categories.*', 'transaction_categories.is_auto');

        res.json({ transaction: { ...txn, account, categories } });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/transactions/:id/notes ──────────────────
// Update user notes on a transaction
router.put('/:id/notes', async (req, res, next) => {
    try {
        const { notes } = req.body;
        await db('transactions').where('id', req.params.id).update({ notes, updated_at: db.fn.now() });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/transactions/:id/exclude ────────────────
// Toggle exclude from analytics
router.put('/:id/exclude', async (req, res, next) => {
    try {
        const txn = await db('transactions').where('id', req.params.id).first();
        if (!txn) return res.status(404).json({ error: 'Transaction not found' });
        await db('transactions').where('id', req.params.id).update({
            is_excluded: !txn.is_excluded,
            updated_at: db.fn.now(),
        });
        res.json({ success: true, is_excluded: !txn.is_excluded });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/transactions/:id/tag ───────────────────
// Manually tag a transaction with a category
router.post('/:id/tag', async (req, res, next) => {
    try {
        const { category_id } = req.body;
        const existing = await db('transaction_categories')
            .where({ transaction_id: req.params.id, category_id })
            .first();

        if (existing) return res.status(409).json({ error: 'Already tagged' });

        await db('transaction_categories').insert({
            transaction_id: parseInt(req.params.id),
            category_id,
            is_auto: false,
        });
        res.status(201).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/transactions/:id/tag/:categoryId ─────
// Remove a category tag from a transaction
router.delete('/:id/tag/:categoryId', async (req, res, next) => {
    try {
        await db('transaction_categories')
            .where({ transaction_id: req.params.id, category_id: req.params.categoryId })
            .del();
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
