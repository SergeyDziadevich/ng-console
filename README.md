<p align="center">
  <img src="./angular.png" width="200" alt="Angular Icon" />
</p>

# NgConsole
NgConsole is the frontend Angular application that serves as the administrative interface for the Cloud Console ecosystem.

**Backend API:** [ng-console-api](https://github.com/SergeyDziadevich/ng-console-api/)

## Key User Features

- **Authentication & Security:** Secure login flow with support for Google OAuth2 and Two-Factor Authentication (2FA).
- **User Management:** Comprehensive interface to create, edit, and manage user accounts with role-based access control (Admin, Moderator).
- **Profile & Settings:** Personalized user settings allowing for account configuration and security management.
- **Document Management:** Upload, delete, securely share documents via short public links without requiring user authentication, digitally sign PDF documents, and dynamically generate new PDFs using customizable templates (such invoices, contract) with live preview capabilities.
- **Audit Logs:** A dedicated interface for administrators to view, filter (by date, action, actor), and export comprehensive audit trails, with customizable data retention settings.
- **Real-Time Chat & Notifications:** Live messaging system and instant push notifications to keep users connected and informed.
- **AI Assistant:** An integrated, intelligent chat assistant powered by Firebase Genkit AI to help users navigate and perform tasks.
- **Analytics Dashboard:** A centralized dashboard displaying system metrics and insights.
- **Support Ticketing:** Integrated ticketing system for users to submit requests and for administrators to manage and resolve support issues.

## Main Functionality

- **Modern UI Framework:** Built with Angular 22 and styled with TailwindCSS 4 for a responsive and sleek user experience.
- **Real-Time Interactions:** Integrated with Socket.IO client for live chat, notifications, and instant updates.
- **AI Integration:** Leverages Firebase Genkit AI (`@genkit-ai/google-genai`) for intelligent assistant features directly in the browser.
- **Robust Testing:** Configured with Vitest for fast unit testing and Playwright for reliable end-to-end (e2e) tests.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
