# PayShare

**PayShare** is a proof-of-concept web app for a service that offers bill sharing.
- Web APP: [https://payyshare.vercel.app](https://payyshare.vercel.app)
- API Documentation: [https://payshare.onrender.com/swagger](https://payshare.onrender.com/swagger)


## Problem Statement

University students often face the inconvenience of splitting bills when buying food together, especially during late-night study/work sessions. Multiple individual transfers lead to unnecessary transaction charges. PayShare aims to streamline this process and reduce associated costs.

## Solution

PayShare allows users to:
- Create and manage shared bills
- Invite friends to participate in bill sharing
- Process payments through Paystack
- Settle bills with a single transfer to the merchant

## How it Works

1. Users create an account
2. A user creates a bill, sets the total amount, and assigns their share
3. The creator sends bill invites to others, assigning amounts to each invitee
4. Invitees accept and pay their share using Paystack (via react-paystack)
5. Payments are verified using Paystack's Verify Transaction API
6. Once fully collated, the bill is marked as closed but not "settled"
7. The creator can then settle the bill by entering the Nigerian bank account details of the recipient

## Paystack Integration

- **Verify Transaction API**: Confirms successful payments
- **Create Transfer Recipient API**: Prepares for bill settlement
- **Initiate Transfer API**: Settles the bill (Note: Currently limited due to account type)
- **react-paystack**: Handles payment UI and processing

## Tech Stack

- **Frontend**: React, Vite, TypeScript, React Router, Tanstack Query, shadcn/ui, react-paystack
- **Backend**: ElysiaJS, Bun, PostgreSQL, Prisma
- **Deployment**: Vercel (Frontend), Render (Backend), Neon (Managed PostgreSQL)

## Future Improvements

1. Implement Subscription Bills using Paystack Plans and Subscription APIs
2. Enhance overall UX on both frontend and backend
3. Explore potential use of Paystack Subaccounts API for a more integrated solution
4. Implement webhooks for real-time payment event tracking

## Paystack APIs and Tools Used

- [Verify Transaction API](https://paystack.com/docs/api/transaction/#verify)
- [Create Transfer Recipient API](https://paystack.com/docs/api/transfer-recipient/)
- [Initiate Transfer API](https://paystack.com/docs/api/transfer/)
- [react-paystack](https://github.com/iamraphson/react-paystack)

## Additional Resources

- [Paystack Supported Webhook Events](https://paystack.com/docs/payments/webhooks/#supported-events)
