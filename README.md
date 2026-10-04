# Expense Tracker

A privacy-first expense tracker for Ethiopia. It turns CBE and telebirr SMS
messages into structured transactions, so only the minimum data needs to
leave the user's phone.

## Status

Early development. Currently working:
- SMS parser for CBE and telebirr (`src/lib/sms-parser`)
- A simple page to paste a message and see the parsed result

Planned: database and authentication, expense ledger, dashboard,
Android SMS collector.

## How the parser works

`parseSms` is a pure function: SMS text in, one of three results out
(`parsed`, `ignored`, `unknown`). Amounts are stored as integer cents,
fees are separated from the principal, and an arithmetic check flags
messages whose totals don't add up. Unrecognised messages are never guessed.

## Run locally

    npm install
    npm run dev

## Privacy

Test fixtures use fake names, numbers and transaction IDs. Never commit
real messages.
