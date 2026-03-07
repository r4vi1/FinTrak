const express = require('express');
const router = express.Router();
const db = require('../db');
const { tagTransactionsForCategory, retagCategory } = require('../services/categoryEngine');

// ── GET /api/categories ──────────────────────────────
// List all categories for a user with transaction counts + totals
router.get('/', async (req, res, next) => {
    try {
        const userId = req.query.user_id || 1;

        const categories = await db('categories')
            .where('user_id', userId)
            .orderBy('sort_order', 'asc');

        // Get stats for each category
        const stats = await db('transaction_categories')
            .join('categories', 'transaction_categories.category_id', 'categories.id')
            .join('transactions', 'transaction_categories.transaction_id', 'transactions.id')
            .where('categories.user_id', userId)
            .where('transactions.is_excluded', false)
            .select('categories.id as category_id')
            .count({ transaction_count: '*' })
            .sum({ total_debit: db.raw("CASE WHEN transactions.type = 'debit' THEN transactions.amount ELSE 0 END") })
            .sum({ total_credit: db.raw("CASE WHEN transactions.type = 'credit' THEN transactions.amount ELSE 0 END") })
            .groupBy('categories.id');

        const statsMap = {};
        stats.forEach((s) => {
            statsMap[s.category_id] = {
                transaction_count: s.transaction_count || 0,
                total_debit: s.total_debit || 0,
                total_credit: s.total_credit || 0,
            };
        });

        // Get rules for each category
        const catIds = categories.map((c) => c.id);
        const rules = await db('category_rules').whereIn('category_id', catIds);
        const rulesMap = {};
        rules.forEach((r) => {
            if (!rulesMap[r.category_id]) rulesMap[r.category_id] = [];
            rulesMap[r.category_id].push(r);
        });

        const enriched = categories.map((c) => ({
            ...c,
            stats: statsMap[c.id] || { transaction_count: 0, total_debit: 0, total_credit: 0 },
            rules: rulesMap[c.id] || [],
        }));

        res.json({ categories: enriched });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/categories/:id ──────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const category = await db('categories').where('id', req.params.id).first();
        if (!category) return res.status(404).json({ error: 'Category not found' });

        const rules = await db('category_rules').where('category_id', category.id);

        // Monthly breakdown for this category
        const monthly = await db('transaction_categories')
            .join('transactions', 'transaction_categories.transaction_id', 'transactions.id')
            .where('transaction_categories.category_id', category.id)
            .where('transactions.is_excluded', false)
            .select(
                db.raw("strftime('%Y-%m', transactions.date) as month"),
            )
            .sum({ total_spent: db.raw("CASE WHEN transactions.type = 'debit' THEN transactions.amount ELSE 0 END") })
            .sum({ total_earned: db.raw("CASE WHEN transactions.type = 'credit' THEN transactions.amount ELSE 0 END") })
            .count({ count: '*' })
            .groupBy('month')
            .orderBy('month', 'asc');

        // Top merchants in this category
        const topMerchants = await db('transaction_categories')
            .join('transactions', 'transaction_categories.transaction_id', 'transactions.id')
            .where('transaction_categories.category_id', category.id)
            .where('transactions.type', 'debit')
            .where('transactions.is_excluded', false)
            .select('transactions.merchant')
            .sum({ total: 'transactions.amount' })
            .count({ count: '*' })
            .groupBy('transactions.merchant')
            .orderBy('total', 'desc')
            .limit(10);

        // Accounts this category spans
        const accountBreakdown = await db('transaction_categories')
            .join('transactions', 'transaction_categories.transaction_id', 'transactions.id')
            .join('accounts', 'transactions.account_id', 'accounts.id')
            .where('transaction_categories.category_id', category.id)
            .where('transactions.is_excluded', false)
            .select('accounts.id', 'accounts.name', 'accounts.color')
            .sum({ total: 'transactions.amount' })
            .count({ count: '*' })
            .groupBy('accounts.id');

        res.json({
            category,
            rules,
            monthly,
            top_merchants: topMerchants,
            account_breakdown: accountBreakdown,
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/categories ─────────────────────────────
// Create a new custom category with rules
router.post('/', async (req, res, next) => {
    try {
        const { user_id = 1, name, color = '#a855f7', icon = 'tag', rules = [] } = req.body;

        if (!name) return res.status(400).json({ error: 'Category name is required' });

        const [categoryId] = await db('categories').insert({
            user_id,
            name,
            color,
            icon,
            is_system: false,
        }).returning('id');

        const catId = typeof categoryId === 'object' ? categoryId.id : categoryId;

        // Insert rules
        if (rules.length > 0) {
            const ruleRows = rules.map((r) => ({
                category_id: catId,
                match_type: r.match_type || 'keyword',
                match_field: r.match_field || 'merchant',
                match_value: r.match_value,
                case_sensitive: r.case_sensitive || false,
            }));
            await db('category_rules').insert(ruleRows);

            // Auto-tag existing transactions
            const result = await tagTransactionsForCategory(catId);
            res.status(201).json({ category_id: catId, auto_tagged: result.tagged });
        } else {
            res.status(201).json({ category_id: catId, auto_tagged: 0 });
        }
    } catch (err) {
        if (err.message?.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Category with this name already exists' });
        }
        next(err);
    }
});

// ── PUT /api/categories/:id ──────────────────────────
// Update category name/color/icon
router.put('/:id', async (req, res, next) => {
    try {
        const { name, color, icon } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (color !== undefined) updates.color = color;
        if (icon !== undefined) updates.icon = icon;
        updates.updated_at = db.fn.now();

        await db('categories').where('id', req.params.id).update(updates);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/categories/:id/rules ────────────────────
// Replace all rules for a category and re-tag
router.put('/:id/rules', async (req, res, next) => {
    try {
        const { rules = [] } = req.body;
        const categoryId = parseInt(req.params.id);

        // Delete old rules
        await db('category_rules').where('category_id', categoryId).del();

        // Insert new rules
        if (rules.length > 0) {
            const ruleRows = rules.map((r) => ({
                category_id: categoryId,
                match_type: r.match_type || 'keyword',
                match_field: r.match_field || 'merchant',
                match_value: r.match_value,
                case_sensitive: r.case_sensitive || false,
            }));
            await db('category_rules').insert(ruleRows);
        }

        // Re-tag transactions
        const result = await retagCategory(categoryId);
        res.json({ success: true, retagged: result.tagged });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/categories/:id ───────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const category = await db('categories').where('id', req.params.id).first();
        if (!category) return res.status(404).json({ error: 'Category not found' });
        if (category.is_system) return res.status(403).json({ error: 'Cannot delete system categories' });

        await db('categories').where('id', req.params.id).del();
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
