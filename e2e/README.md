## E2E Architecture (Page Object Model)
The tests are organized into three layers for maintainability and reusability:

## Pages (e2e/pages/): 
Contains the structure and locators for individual UI screens.
ticket-list.page.ts: Interacts with the ticket list screen.
create-ticket.page.ts: Interacts with the form fields on the create ticket screen.

## Flows (e2e/flows/):
Contains higher-level business processes combining multiple pages.
ticket.flow.ts: Orchestrates the addTicket sequence (navigating, filling the form, submitting, and validating the toast and redirect).

## Specs (e2e/specs/):
Contains the executable test files.

add-ticket.spec.ts: Executes the "Add Ticket" test utilizing the TicketFlow.

Running the Tests
To run the tests, make sure both your NestJS API and Angular development server are running, then execute the following command in the /Users/dweb/angular/user-management directory:

```bash
npm run e2e
```
