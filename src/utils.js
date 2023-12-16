//transferir pra ca funcoes de assinatura e afins

import { SignJWT } from "jose";
import { createPrivateKey } from 'crypto';
import fs from 'fs';
import config from "./config.js";
import { v4 } from "uuid";


function getPrivateKey() {
    const signingKey = fs.readFileSync(config.sigingKeyPath);
    const key = createPrivateKey(signingKey);
    return key;
}

export const signPayload = async function (requestBody, audience) {
    const key = getPrivateKey();

    let signedRequestBody;
    try {
        signedRequestBody = await new SignJWT(requestBody)
        .setProtectedHeader({
          alg: "PS256",
          typ: "JWT",
          kid: config.signingCertKID,
        })
        .setIssuedAt()
        .setIssuer(config.organisationId)
        .setJti(v4())
        .setAudience(audience)
        .setExpirationTime("5m")
        .sign(key);
    } catch (e){
        console.log("Error when trying to sign request body: ", e);
        throw e;
    }

    return signedRequestBody;
}