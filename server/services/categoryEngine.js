/**
 * Category Engine
 *
 * Core logic for FinTrak's cross-account custom categorization.
 * Given a set of category rules, scans transactions and auto-tags them.
 * Supports keyword, regex, and exact matching on merchant or description fields.
 */

const db = require('../db');

/**
 * Run the category engine for a single category (by its rules).
 * Finds all matching transactions and inserts tags into transaction_categories.
 *
 * @param {number} categoryId
 * @returns {{ tagged: number, skipped: number }}
 */
async function tagTransactionsForCategory(categoryId) {
    const rules = await db('category_rules').where('category_id', categoryId);
    if (rules.length === 0) return { tagged: 0, skipped: 0 };

    // Get all transactions (from the same user's accounts)
    const category = await db('categories').where('id', categoryId).first();
    if (!category) return { tagged: 0, skipped: 0 };

    const userAccounts = await db('accounts').where('user_id', category.user_id).select('id');
    const accountIds = userAccounts.map((a) => a.id);

    const transactions = await db('transactions')
        .whereIn('account_id', accountIds)
        .select('id', 'merchant', 'description', 'raw_category');

    // Find existing tags for this category to avoid duplicates
    const existingTags = await db('transaction_categories')
        .where('category_id', categoryId)
        .select('transaction_id');
    const existingSet = new Set(existingTags.map((t) => t.transaction_id));

    const newTags = [];

    for (const txn of transactions) {
        if (existingSet.has(txn.id)) continue;

        for (const rule of rules) {
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
                } catch {
                    /* invalid regex, skip */
                }
            }

            if (matched) {
                newTags.push({
                    transaction_id: txn.id,
                    category_id: categoryId,
                    is_auto: true,
                });
                break; // One match per transaction per category is enough
            }
        }
    }

    // Insert in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < newTags.length; i += BATCH_SIZE) {
        await db('transaction_categories').insert(newTags.slice(i, i + BATCH_SIZE));
    }

    return { tagged: newTags.length, skipped: existingSet.size };
}

/**
 * Run the category engine for ALL categories belonging to a user.
 *
 * @param {number} userId
 * @returns {{ totalTagged: number, byCategory: Object[] }}
 */
async function tagAllForUser(userId) {
    const categories = await db('categories').where('user_id', userId);
    const results = [];

    for (const cat of categories) {
        const result = await tagTransactionsForCategory(cat.id);
        results.push({ categoryId: cat.id, name: cat.name, ...result });
    }

    const totalTagged = results.reduce((sum, r) => sum + r.tagged, 0);
    return { totalTagged, byCategory: results };
}

/**
 * Re-tag a category: clears all auto-tags and re-runs from scratch.
 * Useful when rules are updated.
 *
 * @param {number} categoryId
 */
async function retagCategory(categoryId) {
    // Remove existing auto-tags
    await db('transaction_categories')
        .where('category_id', categoryId)
        .where('is_auto', true)
        .del();

    // Re-run tagging
    return tagTransactionsForCategory(categoryId);
}

module.exports = {
    tagTransactionsForCategory,
    tagAllForUser,
    retagCategory,
};
