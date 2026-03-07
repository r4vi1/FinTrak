/**
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('categories', (table) => {
            table.increments('id').primary();
            table.integer('user_id').unsigned().notNullable()
                .references('id').inTable('users').onDelete('CASCADE');
            table.string('name').notNullable();                            // e.g. "Zomato", "Groceries", "Subscriptions"
            table.string('color').defaultTo('#a855f7');                    // Hex color for UI
            table.string('icon').defaultTo('tag');                         // Icon identifier
            table.boolean('is_system').defaultTo(false);                   // System-generated vs user-created
            table.integer('sort_order').defaultTo(0);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());

            table.unique(['user_id', 'name']);
        })
        .createTable('category_rules', (table) => {
            table.increments('id').primary();
            table.integer('category_id').unsigned().notNullable()
                .references('id').inTable('categories').onDelete('CASCADE');
            table.enu('match_type', ['keyword', 'regex', 'exact']).notNullable();
            table.string('match_field').defaultTo('merchant');              // Which field to match: 'merchant' or 'description'
            table.string('match_value').notNullable();                     // The keyword, regex, or exact value
            table.boolean('case_sensitive').defaultTo(false);
            table.timestamp('created_at').defaultTo(knex.fn.now());
        })
        .createTable('transaction_categories', (table) => {
            table.integer('transaction_id').unsigned().notNullable()
                .references('id').inTable('transactions').onDelete('CASCADE');
            table.integer('category_id').unsigned().notNullable()
                .references('id').inTable('categories').onDelete('CASCADE');
            table.boolean('is_auto').defaultTo(true);                      // Auto-tagged by engine vs manually assigned
            table.timestamp('created_at').defaultTo(knex.fn.now());

            table.primary(['transaction_id', 'category_id']);
        });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('transaction_categories')
        .dropTableIfExists('category_rules')
        .dropTableIfExists('categories');
};
