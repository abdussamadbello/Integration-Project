import dotenv from 'dotenv';

dotenv.config();

export interface OAuthConfig {
    authorizationURL: string;
    tokenURL: string;
    clientID: string;
    clientSecret: string;
    redirectURI: string;
}

