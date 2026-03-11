/**
 * Migration: Create aa_consents table
 * Tracks the lifecycle of Setu Account Aggregator consent requests
 * 
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
    return knex.schema.createTable('aa_consents', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');

        // Setu-specific identifiers
        table.string('setu_consent_id').notNullable().unique();  // UUID returned by Setu
        table.string('consent_url');                              // Setu webview URL for user approval
        table.string('data_session_id');                          // Session ID for FI data fetch

        // Consent lifecycle state
        table.enu('status', [
            'PENDING',     // Created, waiting for user action
            'APPROVED',    // User approved on Setu's webview
            'ACTIVE',      // Ready for data fetch
            'REJECTED',    // User rejected
            'REVOKED',     // Previously active, now revoked
            'EXPIRED',     // Consent expired
            'FAILED',      // Error during processing
        ]).defaultTo('PENDING');

        // What data was requested
        table.string('vua');                                      // Virtual User Address (mobile@AA)
        table.json('fi_types');                                   // e.g., ["DEPOSIT", "CREDIT_CARD"]
        table.string('data_range_from');                          // ISO date
        table.string('data_range_to');                            // ISO date

        // Metadata
        table.integer('accounts_linked').defaultTo(0);            // How many FIP accounts linked
        table.integer('transactions_synced').defaultTo(0);        // How many txns were imported
        table.text('error_message');                               // Last error if any
        table.json('raw_response');                                // Store full Setu response for debugging

        table.timestamp('consent_approved_at');
        table.timestamp('data_fetched_at');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('aa_consents');
};
