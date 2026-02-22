import SuperTokens from "supertokens-auth-react";
import Session from "supertokens-auth-react/recipe/session";
import Passwordless from "supertokens-auth-react/recipe/passwordless";
import ThirdParty from "supertokens-auth-react/recipe/thirdparty";



let initialized = false;

export function initSuperTokens() {
  if (typeof window === "undefined") return;
  if (initialized) return;

  SuperTokens.init({
    appInfo: {
      appName: "AI Community Platform",
      apiDomain: process.env.NEXT_PUBLIC_API_DOMAIN!,
      websiteDomain: process.env.NEXT_PUBLIC_WEBSITE_DOMAIN!,
      apiBasePath: "/auth",
      websiteBasePath: "/auth",
    },

    recipeList: [
      Session.init(),

      /* Only show Google button (others auto-add later) */
      ThirdParty.init({
        signInAndUpFeature: {
          providers: [
            ThirdParty.Google.init()
          ]
        }
      }),

      Passwordless.init({
        contactMethod: "EMAIL_OR_PHONE",
      }),
    ],
  });

  initialized = true;
}



