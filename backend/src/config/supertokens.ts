import SuperTokens from "supertokens-node";
import Dashboard from "supertokens-node/recipe/dashboard";
import Session from "supertokens-node/recipe/session";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import Passwordless from "supertokens-node/recipe/passwordless";
import dotenv from "dotenv";

import { saveUserToDB } from "../services/user.service.js";
import { sendEmailOTP } from "../services/emailService.js";
import { sendSMSOTP } from "../services/smsService.js";

dotenv.config();

/* ---------------- THIRD PARTY PROVIDERS ---------------- */

const providers: any[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push({
    config: {
      thirdPartyId: "google",
      clients: [
        {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      ],
    },
  });
}

if (process.env.FB_CLIENT_ID && process.env.FB_CLIENT_SECRET) {
  providers.push({
    config: {
      thirdPartyId: "facebook",
      clients: [
        {
          clientId: process.env.FB_CLIENT_ID,
          clientSecret: process.env.FB_CLIENT_SECRET,
        },
      ],
    },
  });
}

if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY &&
  process.env.APPLE_TEAM_ID
) {
  providers.push({
    config: {
      thirdPartyId: "apple",
      clients: [
        {
          clientId: process.env.APPLE_CLIENT_ID,
          additionalConfig: {
            keyId: process.env.APPLE_KEY_ID,
            privateKey: process.env.APPLE_PRIVATE_KEY,
            teamId: process.env.APPLE_TEAM_ID,
          },
        },
      ],
    },
  });
}

/* ---------- THIRD PARTY RECIPE ---------- */

const thirdPartyRecipe =
  providers.length > 0
    ? ThirdParty.init({
        signInAndUpFeature: { providers },

        accountLinking: {
          shouldDoAutomaticAccountLinking: async () => ({
            shouldAutomaticallyLink: true,
            shouldRequireVerification: false,
          }),
        },

        override: {
          functions: (original) => ({
            ...original,

            async signInUp(input) {
              const response = await original.signInUp(input);

              if (response.status === "OK") {
                const user = response.user;

                /* 🔥 THIS IS THE FIX */
                const primaryUserId =
                  user.loginMethods?.[0]?.recipeUserId?.getAsString()
                  user.id;

                await saveUserToDB({
                  id: primaryUserId,
                  email: user.emails?.[0],
                });
              }

              return response;
            },
          }),
        },
      })
    : null;

/* ---------------- SMS DELIVERY ---------------- */

const smsService = process.env.MSG91_AUTH_KEY
  ? {
      service: {
        sendSms: async (input: any) => {
          await sendSMSOTP(input.phoneNumber, input.userInputCode);
        },
      },
    }
  : undefined;

/* ---------------- INIT SUPERTOKENS ---------------- */

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

      accountLinking: {
        shouldDoAutomaticAccountLinking: async () => ({
          shouldAutomaticallyLink: true,
          shouldRequireVerification: false,
        }),
      },

      override: {
        functions: (original) => ({
          ...original,

          async consumeCode(input) {
            const response = await original.consumeCode(input);

            if (response.status === "OK") {
              const user = response.user;

              /* 🔥 SAME FIX HERE */
              const primaryUserId =
                user.loginMethods?.[0]?.recipeUserId?.getAsString()
                user.id;

              await saveUserToDB({
                id: primaryUserId,
                email: user.emails?.[0],
                phone: user.phoneNumbers?.[0],
              });
            }

            return response;
          },
        }),
      },

      emailDelivery: {
        service: {
          sendEmail: async (input) => {
            await sendEmailOTP(input.email, input.userInputCode);
          },
        },
      },

      smsDelivery: smsService,
    }),
  ],
});

