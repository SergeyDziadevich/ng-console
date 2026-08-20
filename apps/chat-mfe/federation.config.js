const { withNativeFederation, shareAll } = require("@angular-architects/native-federation/config");

module.exports = withNativeFederation({
  name: "chat-mfe",
  exposes: {
    "./Routes": "./apps/chat-mfe/src/app/remote-entry/routes.ts",
    "./routes": "./apps/chat-mfe/src/app/remote-entry/routes.ts",
  },
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
  },
  skip: [
    "rxjs/ajax",
    "rxjs/fetch",
    "rxjs/testing",
    "rxjs/webSocket",
  ],
});