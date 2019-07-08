'use strict';

import * as https from 'https';
import * as jwtDecode from 'jwt-decode';
import { Jovo } from 'jovo-core';

interface Data {
    email?: string;
    error?: string;
}

/**
 * 
 * @param this 
 */
async function START(this: Jovo) {
    const data: Data = {};
    // @ts-ignore
    if (this.isAlexaSkill()) {
        const config = this.$components.EMAIL.config.alexa;
        const token = this.getAccessToken();
        if (config.type === 'account-linking') {
            if (!token) {
                this.$speech.t('component-email-start-account-linking');
                // @ts-ignore
                this.$alexaSkill.showAccountLinkingCard()
                    .tell(this.$speech);
            } else {
                await accountLinkingAlexa(config, data, token);
                this.$components.EMAIL.$response = {
                    status: data.error ? 'ERROR' : 'SUCCESSFUL',
                    data
                };

                this.toStateIntent(this.$components.EMAIL.stateBeforeDelegate, this.$components.EMAIL.onCompletedIntent!);
            }
        } else if (config.type === 'contact-permissions') {
            try {
                // @ts-ignore
                data.email = await this.$alexaSkill.$user.getEmail()

                this.$components.EMAIL.$response = {
                    status: 'SUCCESSFUL',
                    data
                };
                this.toStateIntent(this.$components.EMAIL.stateBeforeDelegate, this.$components.EMAIL.onCompletedIntent!);
            } catch (error) {
                if (error.code === 'ACCESS_DENIED' || error.code === 'NO_USER_PERMISSION') {
                    this.$speech.t('component-email-start-contact-permissions');
                    // @ts-ignore
                    this.$alexaSkill.showAskForContactPermissionCard('email')
                        .tell(this.$speech);
                } else {
                    this.$components.EMAIL.$response = {
                        status: 'ERROR',
                        data: {
                            error
                        }
                    }
                    this.toStateIntent(this.$components.EMAIL.stateBeforeDelegate, this.$components.EMAIL.onCompletedIntent!);
                }
            }
        }
        // @ts-ignore
    } else if (this.isGoogleAction()) {
        const config = this.$components.EMAIL.config;
        const token = this.getAccessToken();
        if (!token) {
            // @ts-ignore
            this.askForSignIn();
        } else {
            await accountLinkingGoogleAssistant(config, data, token, this.$request!);
            this.$components.EMAIL.$response = {
                status: data.error ? 'ERROR' : 'SUCCESSFUL',
                data
            };

            this.toStateIntent(this.$components.EMAIL.stateBeforeDelegate, this.$components.EMAIL.onCompletedIntent!);
        }
    }
}

async function ON_SIGN_IN(this: Jovo) {
    const config = this.$components.EMAIL.config;
    const data: Data = {};
    const token = this.getAccessToken()!;
    // @ts-ignore
    if (this.isAlexaSkill()) {
        await accountLinkingAlexa(config, data, token)
        // @ts-ignore
    } else if (this.isGoogleAction()) {
        await accountLinkingGoogleAssistant(config, data, token, this.$request!);
    }

    this.$components.EMAIL.$response = {
        status: data.error ? 'ERROR' : 'SUCCESSFUL',
        data
    };

    this.toStateIntent(this.$components.EMAIL.stateBeforeDelegate, this.$components.EMAIL.onCompletedIntent!);
}

async function accountLinkingAlexa(config: { [key: string]: any }, data: Data, token: string) {
    if (config.alexa.accountLinkingProvider === 'auth0') {
        return await auth0Request('alexa', config, data, token);
    } else {
        const url = `https://api.amazon.com/user/profile?access_token=${token}`;
        try {
            const res: { email?: string } = await httpsGet(url, {});
            data.email = res.email;
        } catch (error) {
            data.error = error;
        }
    }
}

async function accountLinkingGoogleAssistant(config: { [key: string]: any }, data: Data, token: string, request: { [key: string]: any }) {
    if (config.googleAssistant.accountLinkingProvider === 'auth0') {
        await auth0Request('googleAssistant', config, data, token)
    } else {
        const { idToken } = request.originalDetectIntentRequest.payload.user;
        const userInfo: { email?: string } = jwtDecode(idToken);
        data.email = userInfo.email;
    }
}

async function auth0Request(platform: string, config: { [key: string]: any }, data: Data, token: string) {
    try {
        const res: { email?: string } = await httpsGet(
            config[platform].uri,
            { headers: { authorization: `Bearer ${token}` } }
        );
        data.email = res.email;
    } catch (error) {
        data.error = error;
    }
}

function httpsGet(url: string, options: { headers: { authorization: string } } | {}): Promise<any> {
    return new Promise((res, rej) => {
        https.get(url, options, (r) => {
            let body = '';
            r.on('data', (d) => {
                body += d;
            });

            r.on('error', (e) => {
                rej(e);
            });

            r.on('end', () => {
                if (r.statusCode === 400) {
                    return rej(new Error('Something went wrong while fetching your users email address.'));
                }
                res(JSON.parse(body));
            });
        }).on('error', (e) => {
            rej(e);
        });
    });
}

export { START, ON_SIGN_IN };