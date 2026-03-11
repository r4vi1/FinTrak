/**
 * Setu Account Aggregator API Routes
 * 
 * Endpoints:
 *   POST   /api/aa/consent          - Create a new consent request
 *   GET    /api/aa/consent/:id      - Get consent status  
 *   POST   /api/aa/consent/:id/fetch - Trigger data fetch for approved consent
 *   GET    /api/aa/consents         - List all consents for a user
 *   POST   /api/aa/webhook          - Receive Setu notifications (consent + FI data)
 *   GET    /api/aa/config            - Get current Setu config (admin/debug)
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const setuAA = require('../services/setuAAService');

// ── POST /api/aa/consent ─────────────────────────────
// Create a new AA consent request. Returns the Setu webview URL
// for the user to approve.
router.post('/consent', async (req, res, next) => {
    try {
        const { user_id = 1, mobile_number, fi_types, data_range_months } = req.body;

        if (!mobile_number) {
            return res.status(400).json({
                error: 'mobile_number is required',
                hint: 'Provide a 10-digit Indian mobile number',
            });
        }

        const result = await setuAA.createConsent(user_id, mobile_number, {
            fiTypes: fi_types,
            dataRangeMonths: data_range_months,
        });

        res.status(201).json({
            success: true,
            consent: result,
            message: 'Consent created. Redirect user to consentUrl to approve.',
        });
    } catch (err) {
        if (err.setuResponse) {
            return res.status(err.status || 502).json({
                error: 'Setu API Error',
                details: err.setuResponse,
            });
        }
        next(err);
    }
});

// ── GET /api/aa/consent/:consentId ───────────────────
// Check the status of a consent request
router.get('/consent/:consentId', async (req, res, next) => {
    try {
        const { consentId } = req.params;

        // First check local record
        const localRecord = await db('aa_consents')
            .where('setu_consent_id', consentId)
            .first();

        if (!localRecord) {
            return res.status(404).json({ error: 'Consent not found' });
        }

        // Try to get latest status from Setu
        let setuStatus;
        try {
            setuStatus = await setuAA.getConsentStatus(consentId);
        } catch (setuErr) {
            // If Setu is unreachable, return local status
            return res.json({
                consent: {
                    id: localRecord.id,
                    setu_consent_id: localRecord.setu_consent_id,
                    status: localRecord.status,
                    consent_url: localRecord.consent_url,
                    accounts_linked: localRecord.accounts_linked,
                    transactions_synced: localRecord.transactions_synced,
                    created_at: localRecord.created_at,
                    data_fetched_at: localRecord.data_fetched_at,
                },
                source: 'local',
                setu_error: setuErr.message,
            });
        }

        // Return enriched data
        const updatedRecord = await db('aa_consents')
            .where('setu_consent_id', consentId)
            .first();

        res.json({
            consent: {
                id: updatedRecord.id,
                setu_consent_id: updatedRecord.setu_consent_id,
                status: updatedRecord.status,
                consent_url: updatedRecord.consent_url,
                accounts_linked: updatedRecord.accounts_linked,
                transactions_synced: updatedRecord.transactions_synced,
                created_at: updatedRecord.created_at,
                data_fetched_at: updatedRecord.data_fetched_at,
            },
            setu_details: setuStatus,
            source: 'setu',
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/aa/consent/:consentId/fetch ────────────
// Trigger a data fetch for an approved consent.
// This creates a data session, fetches FI data, normalizes it,
// and persists it to the database.
router.post('/consent/:consentId/fetch', async (req, res, next) => {
    try {
        const { consentId } = req.params;
        const { user_id = 1 } = req.body;

        // Step 1: Create data session
        const session = await setuAA.createDataSession(consentId);

        // Step 2: Fetch FI data (may need polling in production)
        const fiData = await setuAA.fetchFIData(session.sessionId);

        // Step 3: Normalize and persist
        const syncResult = await setuAA.normalizeAndPersist(user_id, consentId, fiData);

        res.json({
            success: true,
            session_id: session.sessionId,
            sync: syncResult,
            message: `Synced ${syncResult.accountsCreated} accounts and ${syncResult.transactionsImported} transactions`,
        });
    } catch (err) {
        if (err.setuResponse) {
            return res.status(err.status || 502).json({
                error: 'Setu Data Fetch Error',
                details: err.setuResponse,
            });
        }
        next(err);
    }
});

// ── GET /api/aa/consents ─────────────────────────────
// List all consent records for a user
router.get('/consents', async (req, res, next) => {
    try {
        const userId = req.query.user_id || 1;

        const consents = await db('aa_consents')
            .where('user_id', userId)
            .orderBy('created_at', 'desc')
            .select(
                'id', 'setu_consent_id', 'consent_url', 'status',
                'vua', 'fi_types', 'accounts_linked', 'transactions_synced',
                'data_fetched_at', 'created_at', 'updated_at', 'error_message'
            );

        res.json({
            consents: consents.map(c => ({
                ...c,
                fi_types: JSON.parse(c.fi_types || '[]'),
            })),
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/aa/webhook ─────────────────────────────
// Receive async notifications from Setu.
// Two types:
//   1. Consent status change (APPROVED / REJECTED / REVOKED)
//   2. FI data ready for fetch
router.post('/webhook', async (req, res, next) => {
    try {
        const notification = req.body;
        console.log('📩 Setu Webhook received:', JSON.stringify(notification, null, 2));

        const consentId = notification.consentId || notification.ConsentId;
        const type = notification.type || notification.Type || 'UNKNOWN';

        if (!consentId) {
            return res.status(400).json({ error: 'Missing consentId in notification' });
        }

        // Handle consent status changes
        if (type === 'CONSENT_STATUS_UPDATE' || notification.consentStatus) {
            const status = notification.consentStatus || notification.status;

            await db('aa_consents')
                .where('setu_consent_id', consentId)
                .update({
                    status: status,
                    updated_at: db.fn.now(),
                    ...(status === 'ACTIVE' ? { consent_approved_at: db.fn.now() } : {}),
                    ...(status === 'REJECTED' ? { error_message: 'User rejected consent' } : {}),
                    ...(status === 'REVOKED' ? { error_message: 'User revoked consent' } : {}),
                });

            console.log(`✅ Consent ${consentId} updated to ${status}`);
        }

        // Handle FI data ready notification
        if (type === 'SESSION_STATUS_UPDATE' || notification.sessionStatus) {
            const sessionStatus = notification.sessionStatus || notification.status;

            if (sessionStatus === 'COMPLETED' || sessionStatus === 'PARTIAL') {
                const consent = await db('aa_consents')
                    .where('setu_consent_id', consentId)
                    .first();

                if (consent && consent.data_session_id) {
                    try {
                        const fiData = await setuAA.fetchFIData(consent.data_session_id);
                        await setuAA.normalizeAndPersist(consent.user_id, consentId, fiData);
                        console.log(`✅ Auto-synced data for consent ${consentId}`);
                    } catch (fetchErr) {
                        console.error(`❌ Auto-sync failed for ${consentId}:`, fetchErr.message);
                        await db('aa_consents')
                            .where('setu_consent_id', consentId)
                            .update({ error_message: fetchErr.message, updated_at: db.fn.now() });
                    }
                }
            }
        }

        // Always respond 200 to Setu so they don't retry
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Webhook processing error:', err);
        // Still respond 200 to avoid Setu retries
        res.json({ success: true, error: err.message });
    }
});

// ── GET /api/aa/config ───────────────────────────────
// Debug endpoint to check current Setu configuration
router.get('/config', (req, res) => {
    res.json(setuAA.getConfig());
});

module.exports = router;
