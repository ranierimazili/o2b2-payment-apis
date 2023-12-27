import express from 'express';
import { validateAuthentication, validatePostHeaders, validateGetHeaders, validateRequestBody, validateGetConsentRequest, validateGetPaymentRequest } from './validations.js';
import { createPaymentConsentSignedResponse, createPaymentInitiationSignedResponse, patchPaymentInitiationSignedResponse, returnNotFound, returnBadRequest, returnBadSignature, returnUnauthorised, signGetResponse } from './results.js';
import config from './config.js'
import MemoryAdapter from './persistence.js';

const router = express.Router();
const db = new MemoryAdapter();

router.post('/consents', async (req, res) => {
    const tokenDetails = await validateAuthentication(req);

    if (!tokenDetails) {
        res.status(401).json(returnUnauthorised());
        return;
    }

    if (!validatePostHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }

    const { payload, clientOrganisationId } = await validateRequestBody(req, tokenDetails.client_id, config.audiences.createConsent);
    if (!payload) {
        res.status(400).json(returnBadSignature());
        return;
    } 
    
    const response = await createPaymentConsentSignedResponse(payload, clientOrganisationId, db);
        
    res.status(201)
        .type('application/jwt')
        .set('x-fapi-interaction-id', req.headers['x-fapi-interaction-id'])
        .send(response);
});

router.get('/consents/:consentId', async (req, res) => {
    const tokenDetails = await validateAuthentication(req);

    if (!tokenDetails) {
        res.status(401).json(returnUnauthorised());
        return;
    }

    if (!validateGetHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }

    const { payload, clientOrganisationId } = await validateGetConsentRequest(req, tokenDetails.client_id, db);
    if (!payload) {
        res.status(404).json(returnNotFound());
        return;
    } 
    
    const response = await signGetResponse(payload, clientOrganisationId);
        
    res.status(200)
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

    if (!validatePostHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }

    const { payload, clientOrganisationId } = await validateRequestBody(req, tokenDetails.client_id, config.audiences.createPayment);
    if (!payload) {
        res.status(400).json(returnBadSignature());
    } else {
        const consentId = tokenDetails.scope.split(' ').filter(scope => (scope.startsWith('consent:urn')))[0].split('consent:')[1];
        const response = await createPaymentInitiationSignedResponse(payload, clientOrganisationId, consentId, db);
        
        res.status(201)
            .type('application/jwt')
            .set('x-fapi-interaction-id', req.headers['x-fapi-interaction-id'])
            .send(response);
    }
});

router.get('/pix/payments/:paymentId', async (req, res) => {
    const tokenDetails = await validateAuthentication(req);

    if (!tokenDetails) {
        res.status(401).json(returnUnauthorised());
        return;
    }

    if (!validateGetHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }
    
    const { payload, clientOrganisationId } = await validateGetPaymentRequest(req, tokenDetails.client_id, db);
    if (!payload) {
        res.status(404).json(returnNotFound());
        return;
    } 
    
    const response = await signGetResponse(payload, clientOrganisationId);
        
    res.status(200)
        .type('application/jwt')
        .set('x-fapi-interaction-id', req.headers['x-fapi-interaction-id'])
        .send(response);
});

router.patch('/pix/payments/:paymentId', async (req, res) => {
    const tokenDetails = await validateAuthentication(req);

    if (!tokenDetails) {
        res.status(401).json(returnUnauthorised());
        return;
    }

    if (!validateGetHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }
    
    const { payload, clientOrganisationId } = await validateRequestBody(req, tokenDetails.client_id, config.audiences.createPayment);
    if (!payload) {
        res.status(404).json(returnNotFound());
        return;
    } 
    
    const response = await patchPaymentInitiationSignedResponse(payload, clientOrganisationId, req.params.paymentId, db);
        
    res.status(200)
        .type('application/jwt')
        .set('x-fapi-interaction-id', req.headers['x-fapi-interaction-id'])
        .send(response);
});

export default router;