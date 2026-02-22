import SuperTokens from "supertokens-node";
import Dashboard from "supertokens-node/recipe/dashboard";
import Session from "supertokens-node/recipe/session";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import Passwordless from "supertokens-node/recipe/passwordless";
import dotenv from "dotenv";

import { sendEmailOTP } from "../services/emailService";
import { sendSMSOTP } from "../services/smsService";

dotenv.config();

/* ---------------- THIRD PARTY PROVIDERS ---------------- */

const providers: any[] = [];

/* GOOGLE */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push({
    config: {
      thirdPartyId: "google",
      clients: [{
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      }]
    }
  });
}

/* FACEBOOK */
if (process.env.FB_CLIENT_ID && process.env.FB_CLIENT_SECRET) {
  providers.push({
    config: {
      thirdPartyId: "facebook",
      clients: [{
        clientId: process.env.FB_CLIENT_ID,
        clientSecret: process.env.FB_CLIENT_SECRET
      }]
    }
  });
}

/* APPLE */
if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY &&
  process.env.APPLE_TEAM_ID
) {
  providers.push({
    config: {
      thirdPartyId: "apple",
      clients: [{
        clientId: process.env.APPLE_CLIENT_ID,
        additionalConfig: {
          keyId: process.env.APPLE_KEY_ID,
          privateKey: process.env.APPLE_PRIVATE_KEY,
          teamId: process.env.APPLE_TEAM_ID,
        }
      }]
    }
  });
}

const thirdPartyRecipe =
  providers.length > 0
    ? ThirdParty.init({
        signInAndUpFeature: { providers }
      })
    : null;

/* ---------------- PASSWORDLESS ---------------- */

const smsService = process.env.MSG91_AUTH_KEY
  ? {
      service: {
        sendSms: async (input: any) => {
          await sendSMSOTP(
            input.phoneNumber,
            input.userInputCode
          );
        },
      },
    }
  : undefined;

/* ---------------- INIT ---------------- */

SuperTokens.init({
  framework: "express",

  supertokens: {
    connectionURI: "http://localhost:3567",
  },

  appInfo: {
    appName: "AI Community Platform",
    apiDomain: "http://localhost:5000",
    websiteDomain: "http://localhost:3000",
    apiBasePath: "/auth",
    websiteBasePath: "/auth",
  },

  recipeList: [
    Dashboard.init(),
    Session.init(),

    ...(thirdPartyRecipe ? [thirdPartyRecipe] : []),

    Passwordless.init({
      flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
      contactMethod: "EMAIL_OR_PHONE",

      emailDelivery: {
        service: {
          sendEmail: async (input) => {
            await sendEmailOTP(
              input.email,
              input.userInputCode
            );
          },
        },
      },

      smsDelivery: smsService,
    }),
  ],
});

