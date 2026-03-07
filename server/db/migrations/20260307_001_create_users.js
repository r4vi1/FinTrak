/**
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('email').notNullable().unique();
        table.string('name').notNullable();
        table.string('password_hash').notNullable();
        table.string('avatar_url');
        table.string('currency').defaultTo('INR');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users');
};
