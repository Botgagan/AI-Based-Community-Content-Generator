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

async function fetchGoogleProfileFromAccessToken(accessToken: string): Promise<{
  name?: string;
  picture?: string;
}> {
  const normalizeName = (data: Record<string, unknown>) => {
    const directName = typeof data.name === "string" ? data.name : undefined;
    const given = typeof data.given_name === "string" ? data.given_name : undefined;
    const family = typeof data.family_name === "string" ? data.family_name : undefined;
    return (
      directName ||
      [given, family].filter((part): part is string => !!part && part.trim().length > 0).join(" ") ||
      undefined
    );
  };

  const fromOAuthUserinfoV3 = async () => {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) return {};
    const data = (await response.json()) as Record<string, unknown>;
    return {
      name: normalizeName(data),
      picture: typeof data.picture === "string" ? data.picture : undefined,
    };
  };

  const fromOAuthUserinfoV2 = async () => {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) return {};
    const data = (await response.json()) as Record<string, unknown>;
    return {
      name: normalizeName(data),
      picture: typeof data.picture === "string" ? data.picture : undefined,
    };
  };

  const fromPeopleApi = async () => {
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=names,photos",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) return {};
    const data = (await response.json()) as Record<string, unknown>;
    const names = Array.isArray(data.names) ? (data.names as Array<Record<string, unknown>>) : [];
    const photos = Array.isArray(data.photos) ? (data.photos as Array<Record<string, unknown>>) : [];

    const firstName = names.find((n) => typeof n.displayName === "string");
    const firstPhoto = photos.find((p) => typeof p.url === "string");

    return {
      name: firstName?.displayName as string | undefined,
      picture: firstPhoto?.url as string | undefined,
    };
  };

  try {
    const v3 = await fromOAuthUserinfoV3().catch(() => ({}));
    if (v3.name && v3.picture) return v3;

    const v2 = await fromOAuthUserinfoV2().catch(() => ({}));
    if (v2.name && v2.picture) return v2;

    const people = await fromPeopleApi().catch(() => ({}));

    return {
      name: v3.name || v2.name || people.name,
      picture: v3.picture || v2.picture || people.picture,
    };
  } catch {
    return {};
  }
}

const providers: any[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push({
    config: {
      thirdPartyId: "google",
      authorizationEndpointQueryParams: {
        scope: "openid email profile https://www.googleapis.com/auth/userinfo.profile",
        prompt: "consent",
        include_granted_scopes: "true",
      },
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
                const primaryUserId = user.id;
                const thirdPartyId = input.thirdPartyId;

                const rawFromUserInfoApi = (response as any).rawUserInfoFromProvider?.fromUserInfoAPI;
                const rawFromIdToken = (response as any).rawUserInfoFromProvider?.fromIdTokenPayload;
                const oAuthTokens = (response as any).oAuthTokens;

                let providerName =
                  (rawFromUserInfoApi?.name as string | undefined) ??
                  (rawFromUserInfoApi?.full_name as string | undefined) ??
                  (rawFromUserInfoApi?.displayName as string | undefined) ??
                  (rawFromUserInfoApi?.given_name as string | undefined) ??
                  (rawFromIdToken?.name as string | undefined) ??
                  (rawFromIdToken?.full_name as string | undefined) ??
                  (rawFromIdToken?.displayName as string | undefined) ??
                  (rawFromIdToken?.given_name as string | undefined) ??
                  undefined;

                if (!providerName) {
                  const given =
                    (rawFromUserInfoApi?.given_name as string | undefined) ??
                    (rawFromIdToken?.given_name as string | undefined);
                  const family =
                    (rawFromUserInfoApi?.family_name as string | undefined) ??
                    (rawFromIdToken?.family_name as string | undefined);
                  if (given || family) {
                    providerName = [given, family]
                      .filter((part): part is string => !!part && part.trim().length > 0)
                      .join(" ");
                  }
                }

                let providerAvatar =
                  (rawFromUserInfoApi?.picture as string | undefined) ??
                  (rawFromIdToken?.picture as string | undefined) ??
                  undefined;

                if (thirdPartyId === "google" && (!providerName || !providerAvatar)) {
                  const token =
                    (oAuthTokens?.access_token as string | undefined) ??
                    (oAuthTokens?.accessToken as string | undefined);

                  if (token) {
                    const googleProfile = await fetchGoogleProfileFromAccessToken(token);
                    providerName = providerName || googleProfile.name;
                    providerAvatar = providerAvatar || googleProfile.picture;
                  }
                }

                await saveUserToDB({
                  id: primaryUserId,
                  email: user.emails?.[0],
                  name: providerName,
                  avatarUrl: providerAvatar,
                });
              }

              return response;
            },
          }),
        },
      })
    : null;

const smsService = process.env.MSG91_AUTH_KEY
  ? {
      service: {
        sendSms: async (input: any) => {
          await sendSMSOTP(input.phoneNumber, input.userInputCode);
        },
      },
    }
  : undefined;

SuperTokens.init({
  framework: "express",
  supertokens: {
    connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || "http://localhost:3567",
  },
  appInfo: {
    appName: "AI Community Platform",
    apiDomain: process.env.API_DOMAIN || "http://localhost:5000",
    websiteDomain: process.env.WEBSITE_DOMAIN || "http://localhost:3000",
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
              const primaryUserId = user.id;

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
