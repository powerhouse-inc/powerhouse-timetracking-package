import type { SnapshotReportTransactionsOperations } from "document-models/snapshot-report/v1";

export const snapshotReportTransactionsOperations: SnapshotReportTransactionsOperations =
  {
    addTransactionOperation(state, action) {
      const account = state.snapshotAccounts.find(
        (a) => a.id === action.input.accountId,
      );
      if (!account) {
        throw new Error(`Account with ID ${action.input.accountId} not found`);
      }

      const existingTransaction = account.transactions.find(
        (t) => t.id === action.input.id,
      );
      if (existingTransaction) {
        throw new Error(
          `Transaction with ID ${action.input.id} already exists`,
        );
      }

      const newTransaction = {
        id: action.input.id,
        transactionId: action.input.transactionId,
        counterParty: action.input.counterParty || null,
        amount: action.input.amount,
        datetime: action.input.datetime,
        txHash: action.input.txHash,
        token: action.input.token,
        blockNumber: action.input.blockNumber || null,
        direction: action.input.direction,
        flowType: action.input.flowType || null,
        counterPartyAccountId: action.input.counterPartyAccountId || null,
      };

      account.transactions.push(newTransaction);
    },
    removeTransactionOperation(state, action) {
      let found = false;

      for (const account of state.snapshotAccounts) {
        const transactionIndex = account.transactions.findIndex(
          (t) => t.id === action.input.id,
        );
        if (transactionIndex !== -1) {
          account.transactions.splice(transactionIndex, 1);
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error(`Transaction with ID ${action.input.id} not found`);
      }
    },
    updateTransactionFlowTypeOperation(state, action) {
      let transaction = null;

      for (const account of state.snapshotAccounts) {
        transaction = account.transactions.find(
          (t) => t.id === action.input.id,
        );
        if (transaction) {
          break;
        }
      }

      if (!transaction) {
        throw new Error(`Transaction with ID ${action.input.id} not found`);
      }

      transaction.flowType = action.input.flowType;
    },
    recalculateFlowTypesOperation(state, _action) {
      for (const account of state.snapshotAccounts) {
        for (const tx of account.transactions) {
          if (!tx.counterParty) continue;

          // Find counter-party account
          const counterPartyAccount = state.snapshotAccounts.find(
            (acc) =>
              acc.accountAddress.toLowerCase() ===
              tx.counterParty?.toLowerCase(),
          );

          if (counterPartyAccount) {
            // Update counter-party link if missing
            if (!tx.counterPartyAccountId) {
              tx.counterPartyAccountId = counterPartyAccount.id;
            }

            // Recalculate flow type based on account types
            const fromType =
              tx.direction === "OUTFLOW"
                ? account.type
                : counterPartyAccount.type;
            const toType =
              tx.direction === "OUTFLOW"
                ? counterPartyAccount.type
                : account.type;

            // Flow categorization rules
            if (fromType === "Source") {
              tx.flowType = "TopUp";
            } else if (toType === "Source") {
              tx.flowType = "Return";
            } else if (toType === "Destination") {
              tx.flowType = "TopUp";
            } else if (fromType === "External") {
              tx.flowType = "External";
            } else if (fromType === "Internal" && toType === "Internal") {
              tx.flowType = "Internal";
            } else if (fromType === "Internal" && toType === "External") {
              tx.flowType = "External";
            } else {
              tx.flowType = "External";
            }
          }
        }
      }
    },
  };
