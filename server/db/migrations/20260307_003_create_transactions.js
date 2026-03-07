/**
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('transactions', (table) => {
        table.increments('id').primary();
        table.integer('account_id').unsigned().notNullable()
            .references('id').inTable('accounts').onDelete('CASCADE');
        table.date('date').notNullable();
        table.decimal('amount', 14, 2).notNullable();                   // Always positive
        table.enu('type', ['credit', 'debit']).notNullable();           // Inflow / Outflow
        table.string('merchant').notNullable();                          // e.g. "Zomato", "Amazon"
        table.string('description');                                     // Full transaction description
        table.string('raw_category');                                    // Original category from bank (if any)
        table.string('reference_id');                                    // UPI ref / transaction ID
        table.enu('payment_mode', ['upi', 'card', 'neft', 'imps', 'cash', 'auto_debit', 'other'])
            .defaultTo('other');
        table.text('notes');                                             // User notes
        table.boolean('is_recurring').defaultTo(false);
        table.boolean('is_excluded').defaultTo(false);                   // Exclude from analytics
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Indexes for fast querying
        table.index(['account_id', 'date']);
        table.index(['merchant']);
        table.index(['date']);
    });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('transactions');
};
