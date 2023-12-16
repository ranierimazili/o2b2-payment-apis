import 'dotenv/config'

export default {
    serverPort: process.env.SERVER_PORT,
    instrospection: {
        url: process.env.INTROSPECTION_ENDPOINT,
        user: process.env.INTROSPECTION_USER,
        password: process.env.INTROSPECTION_PASSWORD
    },
    organisationId: process.env.ORGANISATION_ID,
    signingCertKID: process.env.SIGNING_CERT_KID,
    sigingKeyPath: process.env.SIGNING_KEY_PATH,
    audiences: {
        createConsent: process.env.CREATE_CONSENT_AUDIENCE,
        createPayment: process.env.CREATE_PAYMENT_AUDIENCE
    },
    clientDetailsUrl: process.env.CLIENT_DETAILS_ENDPOINT,
    consentIdPrefix: process.env.CONSENT_ID_PREFIX
};