const { withNativeFederation, shareAll } = require("@angular-architects/native-federation/config");

module.exports = withNativeFederation({
  name: "tickets-mfe",
  exposes: {
    "./Routes": "./apps/tickets-mfe/src/app/remote-entry/routes.ts",
    "./routes": "./apps/tickets-mfe/src/app/remote-entry/routes.ts",
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