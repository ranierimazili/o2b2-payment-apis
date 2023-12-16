import express from 'express';
import { validateAuthentication, validateHeaders, validateRequestBody } from './validations.js';
import { createPaymentConsentSignedResponse, createPaymentInitiationSignedResponse, returnBadRequest, returnBadSignature, returnUnauthorised } from './results.js';
import config from './config.js'

const router = express.Router();

router.post('/consents', async (req, res) => {
    const tokenDetails = await validateAuthentication(req);

    if (!tokenDetails) {
        res.status(401).json(returnUnauthorised());
        return;
    }

    if (!validateHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }

    const { payload, clientOrganisationId } = await validateRequestBody(req, tokenDetails.client_id, config.audiences.createConsent);
    if (!payload) {
        res.status(400).json(returnBadSignature());
        return;
    } 
    
    const response = await createPaymentConsentSignedResponse(payload, clientOrganisationId);
        
    res.status(201)
        .type('application/jwt')
        .set('x-fapi-interaction-id', req.headers['x-fapi-interaction-id'])
        .send(response);
    
});

router.post('/pix/payments', async (req, res) => {
    const tokenDetails = await validateAuthentication(req);

    if (!tokenDetails) {
        res.status(401).json(returnUnauthorised());
        return;
    }

    if (!validateHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }

    const { payload, clientOrganisationId } = await validateRequestBody(req, tokenDetails.client_id, config.audiences.createPayment);
    if (!payload) {
        res.status(400).json(returnBadSignature());
    } else {
        const consentId = tokenDetails.scope.split(' ').filter(scope => (scope.startsWith('consent:urn')))[0].split('consent:')[1];
        const response = await createPaymentInitiationSignedResponse(payload, clientOrganisationId, consentId);
        
        res.status(201)
            .type('application/jwt')
            .set('x-fapi-interaction-id', req.headers['x-fapi-interaction-id'])
            .send(response);
    }
});

export default router;