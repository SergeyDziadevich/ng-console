const { withNativeFederation, shareAll } = require("@angular-architects/native-federation/config");

module.exports = withNativeFederation({
  name: "documents-mfe",
  exposes: {
    "./Routes": "./apps/documents-mfe/src/app/remote-entry/routes.ts",
    "./routes": "./apps/documents-mfe/src/app/remote-entry/routes.ts",
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