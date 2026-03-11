/**
 * Setu Account Aggregator Integration Service
 * 
 * Implements the full AA lifecycle:
 *   1. Create Consent  →  POST /consents
 *   2. Get Consent Status  →  GET /consents/:id
 *   3. Create Data Session  →  POST /sessions
 *   4. Fetch FI Data  →  GET /sessions/:id
 * 
 * Sandbox Base URL: https://fiu-uat.setu.co/v2
 * Production Base URL: configured via env
 * 
 * Required ENV vars:
 *   SETU_BASE_URL          - API base (default sandbox)
 *   SETU_CLIENT_ID         - x-client-id header
 *   SETU_CLIENT_SECRET     - x-client-secret header
 *   SETU_PRODUCT_INSTANCE_ID - x-product-instance-id header
 *   SETU_REDIRECT_URL      - Where user lands after consent approval
 */

const db = require('../db');

// ── Configuration ────────────────────────────────────
const CONFIG = {
    baseUrl: process.env.SETU_BASE_URL || 'https://fiu-uat.setu.co/v2',
    clientId: process.env.SETU_CLIENT_ID || 'test-client-id',
    clientSecret: process.env.SETU_CLIENT_SECRET || 'test-client-secret',
    productInstanceId: process.env.SETU_PRODUCT_INSTANCE_ID || 'test-product-instance',
    redirectUrl: process.env.SETU_REDIRECT_URL || 'http://localhost:5173/accounts?consent=done',
};

// ── Helpers ──────────────────────────────────────────

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'x-client-id': CONFIG.clientId,
        'x-client-secret': CONFIG.clientSecret,
        'x-product-instance-id': CONFIG.productInstanceId,
    };
}

/**
 * Make an HTTP request to the Setu AA API
 */
async function setuFetch(method, path, body = null) {
    const url = `${CONFIG.baseUrl}${path}`;
    const options = {
        method,
        headers: getHeaders(),
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        const error = new Error(`Setu API Error: ${response.status} - ${JSON.stringify(data)}`);
        error.status = response.status;
        error.setuResponse = data;
        throw error;
    }

    return data;
}

// ── Core Service Methods ─────────────────────────────

/**
 * Step 1: Create a consent request with Setu
 * 
 * @param {number} userId - Internal user ID
 * @param {string} mobileNumber - User's mobile number (used as VUA)
 * @param {object} options - Optional overrides
 * @returns {object} { consentId, consentUrl, status }
 */
async function createConsent(userId, mobileNumber, options = {}) {
    const {
        fiTypes = ['DEPOSIT', 'CREDIT_CARD'],
        consentDurationMonths = 12,
        dataRangeMonths = 6,
    } = options;

    // Calculate date ranges
    const now = new Date();
    const dataFrom = new Date(now);
    dataFrom.setMonth(dataFrom.getMonth() - dataRangeMonths);

    const consentPayload = {
        consentDuration: {
            unit: 'MONTH',
            value: String(consentDurationMonths),
        },
        vua: mobileNumber, // Setu will append @handle
        dataRange: {
            from: dataFrom.toISOString(),
            to: now.toISOString(),
        },
        context: [],
        redirectUrl: CONFIG.redirectUrl,
    };

    const response = await setuFetch('POST', '/consents', consentPayload);

    // Persist the consent record locally
    const [consentRecord] = await db('aa_consents').insert({
        user_id: userId,
        setu_consent_id: response.id,
        consent_url: response.url,
        status: response.status || 'PENDING',
        vua: response.detail?.vua || mobileNumber,
        fi_types: JSON.stringify(fiTypes),
        data_range_from: dataFrom.toISOString(),
        data_range_to: now.toISOString(),
        raw_response: JSON.stringify(response),
    }).returning('id');

    const recordId = typeof consentRecord === 'object' ? consentRecord.id : consentRecord;

    return {
        id: recordId,
        consentId: response.id,
        consentUrl: response.url,
        status: response.status,
    };
}

/**
 * Step 2: Check the status of a consent request
 * 
 * @param {string} setuConsentId - The Setu consent UUID
 * @returns {object} Updated consent details
 */
async function getConsentStatus(setuConsentId) {
    const response = await setuFetch('GET', `/consents/${setuConsentId}`);

    // Update local record
    const updates = {
        status: response.status,
        accounts_linked: response.accountsLinked?.length || 0,
        raw_response: JSON.stringify(response),
        updated_at: db.fn.now(),
    };

    if (response.status === 'ACTIVE' || response.status === 'APPROVED') {
        updates.consent_approved_at = db.fn.now();
    }

    await db('aa_consents')
        .where('setu_consent_id', setuConsentId)
        .update(updates);

    return {
        consentId: setuConsentId,
        status: response.status,
        accountsLinked: response.accountsLinked || [],
        detail: response.detail,
    };
}

/**
 * Step 3: Create a data session to fetch financial information
 * Only works after consent status is ACTIVE
 * 
 * @param {string} setuConsentId
 * @param {object} options
 * @returns {object} { sessionId, status }
 */
async function createDataSession(setuConsentId, options = {}) {
    // Verify consent is active
    const consent = await db('aa_consents')
        .where('setu_consent_id', setuConsentId)
        .first();

    if (!consent) {
        throw new Error('Consent not found in local database');
    }

    if (consent.status !== 'ACTIVE' && consent.status !== 'APPROVED') {
        throw new Error(`Cannot create data session: consent status is ${consent.status}`);
    }

    const sessionPayload = {
        consentId: setuConsentId,
        DataRange: {
            from: consent.data_range_from,
            to: consent.data_range_to,
        },
        format: 'json',
    };

    const response = await setuFetch('POST', '/sessions', sessionPayload);

    // Update local record with session ID
    await db('aa_consents')
        .where('setu_consent_id', setuConsentId)
        .update({
            data_session_id: response.id,
            updated_at: db.fn.now(),
        });

    return {
        sessionId: response.id,
        consentId: setuConsentId,
        status: response.status,
    };
}

/**
 * Step 4: Fetch the actual financial data from a data session
 * 
 * @param {string} dataSessionId
 * @returns {object} The FI data payload
 */
async function fetchFIData(dataSessionId) {
    const response = await setuFetch('GET', `/sessions/${dataSessionId}`);
    return response;
}

/**
 * Step 5: Normalize Setu FI data into FinTrak's schema and persist
 * 
 * Takes raw Setu financial data and converts it into:
 *   - Accounts (if new FIP accounts are discovered)
 *   - Transactions (normalized with merchant, amount, date, type)
 * 
 * @param {number} userId
 * @param {string} setuConsentId
 * @param {object} fiData - Raw FI data from Setu
 * @returns {{ accountsCreated, transactionsImported }}
 */
async function normalizeAndPersist(userId, setuConsentId, fiData) {
    let accountsCreated = 0;
    let transactionsImported = 0;

    const fiAccounts = fiData?.fips || fiData?.Payload || [];

    for (const fip of fiAccounts) {
        const fipId = fip.fipID || fip.fipId || 'Unknown FIP';
        const accounts = fip.Accounts || fip.accounts || [];

        for (const account of accounts) {
            // Extract account profile
            const profile = account.Profile || account.profile || {};
            const summary = account.Summary || account.summary || {};
            const transactions = account.Transactions?.Transaction
                || account.transactions?.transaction
                || [];

            // Determine account type from FI type
            const fiType = account.fiType || account.FIType || 'DEPOSIT';
            const accountType = mapFITypeToAccountType(fiType);

            // Check if account already exists (by masked number + institution)
            const maskedAccNumber = account.maskedAccNumber
                || profile.Holders?.Holder?.[0]?.maskedAccNumber
                || summary.currentBalance?.toString()?.slice(-4)
                || 'XXXX';

            let existingAccount = await db('accounts')
                .where('user_id', userId)
                .where('institution', fipId)
                .where('account_number_masked', maskedAccNumber)
                .first();

            if (!existingAccount) {
                // Create new account
                const [newAccountId] = await db('accounts').insert({
                    user_id: userId,
                    name: `${fipId} ${accountType.charAt(0).toUpperCase() + accountType.slice(1)}`,
                    type: accountType,
                    institution: fipId,
                    account_number_masked: maskedAccNumber,
                    balance: parseFloat(summary.currentBalance || summary.totalBalance || 0),
                    aa_consent_id: setuConsentId,
                    is_active: true,
                    last_synced_at: db.fn.now(),
                }).returning('id');

                existingAccount = { id: typeof newAccountId === 'object' ? newAccountId.id : newAccountId };
                accountsCreated++;
            } else {
                // Update balance
                await db('accounts')
                    .where('id', existingAccount.id)
                    .update({
                        balance: parseFloat(summary.currentBalance || summary.totalBalance || existingAccount.balance || 0),
                        aa_consent_id: setuConsentId,
                        last_synced_at: db.fn.now(),
                        updated_at: db.fn.now(),
                    });
            }

            // Process transactions
            for (const txn of transactions) {
                const amount = parseFloat(txn.amount || txn.Amount || 0);
                const txnType = (txn.type || txn.Type || 'DEBIT').toUpperCase();
                const date = txn.transactionTimestamp || txn.valueDate || txn.TransactionTimestamp || new Date().toISOString();
                const narration = txn.narration || txn.Narration || txn.reference || '';
                const merchant = extractMerchant(narration);

                // Check for duplicates (same account + amount + date + narration)
                const existing = await db('transactions')
                    .where('account_id', existingAccount.id)
                    .where('amount', amount)
                    .where('date', date.split('T')[0])
                    .where('description', narration)
                    .first();

                if (!existing) {
                    await db('transactions').insert({
                        account_id: existingAccount.id,
                        date: date.split('T')[0], // YYYY-MM-DD
                        amount,
                        type: txnType === 'CREDIT' ? 'credit' : 'debit',
                        merchant,
                        description: narration,
                        raw_category: txn.category || txn.Category || null,
                        payment_mode: txn.mode || txn.Mode || 'UPI',
                        reference: txn.txnId || txn.reference || null,
                        is_recurring: false,
                        is_excluded: false,
                    });
                    transactionsImported++;
                }
            }
        }
    }

    // Update the consent record with sync stats
    await db('aa_consents')
        .where('setu_consent_id', setuConsentId)
        .update({
            accounts_linked: accountsCreated,
            transactions_synced: transactionsImported,
            data_fetched_at: db.fn.now(),
            updated_at: db.fn.now(),
        });

    // Re-run the category engine for the user to auto-tag new transactions
    const { tagAllForUser } = require('./categoryEngine');
    await tagAllForUser(userId);

    return { accountsCreated, transactionsImported };
}

// ── Utility Functions ────────────────────────────────

/**
 * Map Setu FI types to FinTrak account types
 */
function mapFITypeToAccountType(fiType) {
    const mapping = {
        'DEPOSIT': 'savings',
        'SAVINGS': 'savings',
        'CURRENT': 'current',
        'CREDIT_CARD': 'credit_card',
        'TERM_DEPOSIT': 'savings',
        'RECURRING_DEPOSIT': 'savings',
        'PPF': 'savings',
        'NPS': 'savings',
        'MUTUAL_FUNDS': 'wallet',
        'INSURANCE': 'wallet',
    };
    return mapping[fiType] || 'savings';
}

/**
 * Extract a likely merchant name from a bank narration string
 * Indian bank narrations follow patterns like:
 *   "UPI-SWIGGY-merchant@paytm-HDFC0001234-..."
 *   "NEFT-N123-AMAZON PAY-UTIB0001234"  
 *   "POS 412345XXXXXX1234 ZOMATO"
 */
function extractMerchant(narration) {
    if (!narration) return 'Unknown';

    // Try to extract from UPI format: UPI-MERCHANT-vpa-ifsc
    const upiMatch = narration.match(/^UPI[-/]([^-/]+)/i);
    if (upiMatch) return cleanMerchantName(upiMatch[1]);

    // Try to extract from NEFT/RTGS format
    const neftMatch = narration.match(/(?:NEFT|RTGS|IMPS)[-/]\w+[-/]([^-/]+)/i);
    if (neftMatch) return cleanMerchantName(neftMatch[1]);

    // POS transactions
    const posMatch = narration.match(/POS\s+\d*X+\d*\s+(.+)/i);
    if (posMatch) return cleanMerchantName(posMatch[1]);

    // Fallback: take the first recognizable segment
    const segments = narration.split(/[-/|]/);
    if (segments.length > 1) {
        // Skip the first segment if it's a transaction type
        const skipTypes = ['UPI', 'NEFT', 'RTGS', 'IMPS', 'POS', 'ATM', 'ACH', 'ECS', 'NACH', 'SI', 'DR', 'CR', 'INB', 'MOB'];
        for (const seg of segments) {
            const cleaned = seg.trim();
            if (cleaned && !skipTypes.includes(cleaned.toUpperCase()) && cleaned.length > 2) {
                return cleanMerchantName(cleaned);
            }
        }
    }

    // Last resort: return first 30 chars of narration
    return narration.substring(0, 30).trim() || 'Unknown';
}

function cleanMerchantName(name) {
    return name
        .replace(/\d{6,}/g, '')     // Remove long number sequences
        .replace(/@\w+/g, '')       // Remove VPA handles
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .trim()
        || 'Unknown';
}

/**
 * Get the current Setu configuration (for debugging / admin)
 */
function getConfig() {
    return {
        baseUrl: CONFIG.baseUrl,
        hasCredentials: !!(CONFIG.clientId && CONFIG.clientSecret && CONFIG.productInstanceId),
        redirectUrl: CONFIG.redirectUrl,
        isSandbox: CONFIG.baseUrl.includes('uat'),
    };
}

module.exports = {
    createConsent,
    getConsentStatus,
    createDataSession,
    fetchFIData,
    normalizeAndPersist,
    extractMerchant,
    getConfig,
};
