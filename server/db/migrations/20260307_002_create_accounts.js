/**
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('accounts', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
        table.string('name').notNullable();                              // e.g. "HDFC Savings", "ICICI Credit Card"
        table.enu('type', ['savings', 'current', 'credit_card', 'wallet', 'loan']).notNullable();
        table.string('institution').notNullable();                       // e.g. "HDFC Bank", "ICICI Bank"
        table.string('account_number_masked');                           // e.g. "XXXX1234"
        table.decimal('balance', 14, 2).defaultTo(0);                    // Current balance
        table.decimal('credit_limit', 14, 2);                            // For credit cards
        table.string('color');                                           // UI accent color for this account
        table.string('icon');                                            // Icon identifier
        table.boolean('is_active').defaultTo(true);
        table.string('aa_consent_id');                                   // Setu AA consent reference (Phase 2)
        table.timestamp('last_synced_at');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('accounts');
};
