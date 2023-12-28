import express from 'express';
import { validateAuthentication, validatePostHeaders, validateGetHeaders, validateRequestBody, validateGetRequest } from './validations.js';
import { createEnrollmentSignedResponse, createPaymentConsentSignedResponse, createPaymentInitiationSignedResponse, patchPaymentInitiationSignedResponse, returnNotFound, returnBadRequest, returnBadSignature, returnUnauthorised, signGetResponse, patchEnrollmentSignedResponse } from './results.js';
import config from './config.js'
import MemoryAdapter from './persistence.js';

const router = express.Router();
const db = new MemoryAdapter();

router.post('/payments/v3/consents', async (req, res) => {
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

router.get('/payments/v3/consents/:consentId', async (req, res) => {
    const tokenDetails = await validateAuthentication(req);

    if (!tokenDetails) {
        res.status(401).json(returnUnauthorised());
        return;
    }

    if (!validateGetHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }

    const { payload, clientOrganisationId } = await validateGetRequest(req.params.consentId, tokenDetails.client_id, db);
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

router.post('/payments/v3/pix/payments', async (req, res) => {
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

router.get('/payments/v3/pix/payments/:paymentId', async (req, res) => {
    const tokenDetails = await validateAuthentication(req);

    if (!tokenDetails) {
        res.status(401).json(returnUnauthorised());
        return;
    }

    if (!validateGetHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }
    
    const { payload, clientOrganisationId } = await validateGetRequest(req.params.paymentId, tokenDetails.client_id, db);
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

router.patch('/payments/v3/pix/payments/:paymentId', async (req, res) => {
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

router.post('/enrollments/v1/enrollments', async (req, res) => {
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
    
    const response = await createEnrollmentSignedResponse(payload, clientOrganisationId, db);
        
    res.status(201)
        .type('application/jwt')
        .set('x-fapi-interaction-id', req.headers['x-fapi-interaction-id'])
        .send(response);
});

router.get('/enrollments/v1/enrollments/:enrollmentId', async (req, res) => {
    const tokenDetails = await validateAuthentication(req);

    if (!tokenDetails) {
        res.status(401).json(returnUnauthorised());
        return;
    }

    if (!validateGetHeaders(req)) {
        res.status(400).json(returnBadRequest());
        return;
    }

    const { payload, clientOrganisationId } = await validateGetRequest(req.params.enrollmentId, tokenDetails.client_id, db);
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

router.patch('/enrollments/v1/enrollments/:enrollmentId', async (req, res) => {
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
    
    await patchEnrollmentSignedResponse(payload, clientOrganisationId, req.params.enrollmentId, db);
        
    res.status(204)
        .type('application/jwt')
        .set('x-fapi-interaction-id', req.headers['x-fapi-interaction-id'])
        .send();
});

export default router;