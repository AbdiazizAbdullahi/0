# Currency Support Implementation

## Overview
This document outlines the implementation plan for adding currency support to adeegopos.

## Required Changes

### 1. Account Structure Updates
**Files affected:**
- `@/components/accountsComp/createAccount.js`
- `@/electron/services/accounts.js`

Account fields will include:
- _id
- name
- balance
- currency
- type
- state
- createdAt
- projectId

### 2. Transaction Structure Updates
**Files affected:**
- `@/components/transactionsComp/AddTransaction.jsx`
- `@/electron/services/transactions.js`

Transaction fields will include:
- description
- date
- source
- destination
- from
- to
- amount
- currency
- rate
- projectId

### 3. Transaction Processing Logic
**File affected:** `@/electron/services/transactions.js`

Currency conversion rules:
1. Same currency transactions (KES/USD):
   - Process normally without conversion

2. Cross-currency transactions:
   - USD to KES: `newAmount = transaction.amount * transaction.rate`
   - KES to USD: `newAmount = transaction.amount / transaction.rate`