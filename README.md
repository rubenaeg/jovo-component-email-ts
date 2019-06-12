# Configuration

This component allows you to fetch the users email address, either with Account Linking (Alexa|Google Assistant) or Contact Permissions (Alexa). 
Since Alexa allows you both options, you need to choose one in `config.js`:

```javascript
// config.js

alexa: 'contact-permissions' // account-linking|contact-permissions(default)

```
If you decide to choose Account Linking for Alexa or want to get the users email for Google Assistant, you need to create an Auth0 profile,
which provides you with a User-Profile-Link that you have to set in `config.js`:

```javascript
// config.js

auth0: '' // e.g. https://your-username.auth0.com/userinfo
```

To activate Contact Permissions for your skill, either set the permissions in your `project.js` or [directly in the Alexa Skill console](https://developer.amazon.com/docs/custom-skills/request-customer-contact-information-for-use-in-your-skill.html#configure-the-skill-to-request-customer-permissions).

```javascript
// config.js

manifest: {
    permissions: [
        {
            name: "alexa::profile:email:read"
        }
    ]
}
```

You can find tutorials for Account Linking on our website for [Alexa](https://www.jovo.tech/tutorials/alexa-account-linking-auth0) and [Google Assistant](https://www.jovo.tech/tutorials/google-action-account-linking-auth0).
