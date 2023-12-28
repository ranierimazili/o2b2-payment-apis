process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import * as crypto from 'node:crypto';
import config from "./config.js";
import { createLocalJWKSet, jwtVerify, decodeJwt } from 'jose';

const getCertThumbprint = function (cert) {
  let digest;
  if (cert instanceof crypto.X509Certificate) {
    digest = crypto.createHash('sha256').update(cert.raw).digest();
  } else {
    digest = crypto.createHash('sha256')
      .update(
        Buffer.from(
          cert.replace(/(?:-----(?:BEGIN|END) CERTIFICATE-----|\s|=)/g, ''),
          'base64',
        ),
      )
      .digest();
  }
  console.log(digest.toString('base64url'));
  return digest.toString('base64url');
}

const getBasicAuthHeader = function (username, password) {
    const credentials = `${username}:${password}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    return `Basic ${encodedCredentials}`;
}

const introspectAccessToken = async function(bearerToken) {
    try {
        const cleanToken = bearerToken.split(' ')[1];
        const url = config.instrospection.url;

        const formData = new URLSearchParams();
        formData.append('token', cleanToken);

        const requestOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'authorization': getBasicAuthHeader(config.instrospection.user, config.instrospection.password)
            },
            body: formData,
        };
        const res = await fetch(url, requestOptions);
        const json = await res.json();

        return json;
    } catch (e) {
        console.log("Não foi possível realizar a instropecção do token", bearerToken, e);
        return;
    }
}

export const validateClientCredentialsPermissions = function (tokenDetails, clientCert) {
    if (!tokenDetails.active 
        || tokenDetails.token_type !== "token_type" 
        || !tokenDetails.scope.split(" ").includes("payments")
        || tokenDetails.cnf['x5t#S256'] !== getCertThumbprint(clientCert)) {
        return false;
    }
    return true;
}

export const validateAuthentication = async function(req) {
    if (config.validateToken) {
        const tokenDetails = await introspectAccessToken(req.headers['authorization']);
        if (!tokenDetails || !validateClientCredentialsPermissions(tokenDetails, unescape(req.headers['ssl-client-cert']))) {
            return null;
        }
        return tokenDetails;
    } else { //if in dev mode, return a mock tokenDetails
        return {
            active: true,
            token_type: 'token_type',
            scope: 'payments consent:urn:my_dummy_id',
            client_id: 'dummy_client'
        }
    }
}

export const validatePostHeaders = function(req) {
    if (!req.headers['content-type'].split(';').includes('application/jwt')
    || !req.headers['x-fapi-interaction-id'] 
    || !req.headers['x-idempotency-key'] ) {
        return false;
    }
    return true;
}

export const validateGetHeaders = function(req) {
    if (!req.headers['x-fapi-interaction-id'] ) {
        return false;
    }
    return true;
}

const getClientDetails = async function(clientId) {
	try {
        const url = `${config.clientDetailsUrl}/${clientId}`;
        const res = await fetch(url);
        const json = await res.json();
        return json;
    } catch (e) {
        console.log("Não foi possível obter os detalhes do cliente", clientId, e);
        return;
    }
}

const getClientKeys = async function(url) {
	try {
        const res = await fetch(url);
        const json = await res.json();
        return json;
    } catch (e) {
        console.log("Não foi possível obter os detalhes do cliente", clientId, e);
        return;
    }
}

const validateSignedRequest = async function(clientJwks, clientOrganisationId, signedResponseBody, audience) {
    try {
		const jwks = createLocalJWKSet(clientJwks);

		let result = {};
		result = await jwtVerify(signedResponseBody, jwks, {
			issuer: clientOrganisationId,
			audience: audience,
			clockTolerance: 5,
			maxTokenAge: 300
		});

		return result.payload
	} catch (e) {
		console.log("Erro ao tentar validar a assinatura da requisição", e);
	}
}

const extractOrgIdFromJwksUri = function(url) {
	const urlParts = new URL(url);
	const pathSegments = urlParts.pathname.split('/').filter(segment => segment !== '');
	return pathSegments[0];
}

export const validateRequestBody = async function(req, clientId, audience) {
	try {
        if (config.validateSignature) {
            const client = await getClientDetails(clientId);
            const clientJwks = await getClientKeys(client.jwksUri);
            const clientOrganisationId = extractOrgIdFromJwksUri(client.jwksUri);
            const payload = await validateSignedRequest(clientJwks, clientOrganisationId, req.body, audience);
            return {
                payload,
                clientOrganisationId
            };
        } else { //if in dev mode, return a mock tokenDetails
            const payload = decodeJwt(req.body);
            const clientOrganisationId = 'mock_client_org_id';
            return {
                payload,
                clientOrganisationId
            };
        }
	} catch (e) {
		console.log("Erro ao tentar validar os dados da requisição", e);
		return;
	}
}

export const validateGetConsentRequest = async function(req, clientId, db) {
    const payload = db.get(req.params.consentId);
    let clientOrganisationId = 'mock_client_org_id'
    if (config.validateSignature) {
        const client = await getClientDetails(clientId);    
        clientOrganisationId = extractOrgIdFromJwksUri(client.jwksUri);
    }
    return {
        payload,
        clientOrganisationId
    }
}

export const validateGetPaymentRequest = async function(req, clientId, db) {
    const payload = db.get(req.params.paymentId);
    let clientOrganisationId = 'mock_client_org_id'
    if (config.validateSignature) {
        const client = await getClientDetails(clientId);    
        clientOrganisationId = extractOrgIdFromJwksUri(client.jwksUri);
    }
    return {
        payload,
        clientOrganisationId
    }
}

export const validateGetRequest = async function(id, clientId, db) {
    const payload = db.get(id);
    let clientOrganisationId = 'mock_client_org_id'
    if (config.validateSignature) {
        const client = await getClientDetails(clientId);    
        clientOrganisationId = extractOrgIdFromJwksUri(client.jwksUri);
    }
    return {
        payload,
        clientOrganisationId
    }
}