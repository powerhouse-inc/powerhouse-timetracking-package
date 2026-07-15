import type { SnapshotReportBalancesOperations } from "document-models/snapshot-report/v1";

export const snapshotReportBalancesOperations: SnapshotReportBalancesOperations =
  {
    setStartingBalanceOperation(state, action) {
      const account = state.snapshotAccounts.find(
        (a) => a.id === action.input.accountId,
      );
      if (!account) {
        throw new Error(`Account with ID ${action.input.accountId} not found`);
      }

      // First check by balanceId
      const existingById = account.startingBalances.find(
        (b) => b.id === action.input.balanceId,
      );
      if (existingById) {
        existingById.token = action.input.token;
        existingById.amount = action.input.amount;
        return;
      }

      // Then check by token to prevent duplicates
      const existingByToken = account.startingBalances.find(
        (b) => b.token === action.input.token,
      );
      if (existingByToken) {
        existingByToken.id = action.input.balanceId;
        existingByToken.amount = action.input.amount;
        return;
      }

      // Only add new if no existing balance for this token
      account.startingBalances.push({
        id: action.input.balanceId,
        token: action.input.token,
        amount: action.input.amount,
      });
    },
    setEndingBalanceOperation(state, action) {
      const account = state.snapshotAccounts.find(
        (a) => a.id === action.input.accountId,
      );
      if (!account) {
        throw new Error(`Account with ID ${action.input.accountId} not found`);
      }

      // First check by balanceId
      const existingById = account.endingBalances.find(
        (b) => b.id === action.input.balanceId,
      );
      if (existingById) {
        existingById.token = action.input.token;
        existingById.amount = action.input.amount;
        return;
      }

      // Then check by token to prevent duplicates
      const existingByToken = account.endingBalances.find(
        (b) => b.token === action.input.token,
      );
      if (existingByToken) {
        existingByToken.id = action.input.balanceId;
        existingByToken.amount = action.input.amount;
        return;
      }

      // Only add new if no existing balance for this token
      account.endingBalances.push({
        id: action.input.balanceId,
        token: action.input.token,
        amount: action.input.amount,
      });
    },
    removeStartingBalanceOperation(state, action) {
      const account = state.snapshotAccounts.find(
        (a) => a.id === action.input.accountId,
      );
      if (!account) {
        throw new Error(`Account with ID ${action.input.accountId} not found`);
      }

      const balanceIndex = account.startingBalances.findIndex(
        (b) => b.id === action.input.balanceId,
      );
      if (balanceIndex === -1) {
        throw new Error(`Balance with ID ${action.input.balanceId} not found`);
      }

      account.startingBalances.splice(balanceIndex, 1);
    },
    removeEndingBalanceOperation(state, action) {
      const account = state.snapshotAccounts.find(
        (a) => a.id === action.input.accountId,
      );
      if (!account) {
        throw new Error(`Account with ID ${action.input.accountId} not found`);
      }

      const balanceIndex = account.endingBalances.findIndex(
        (b) => b.id === action.input.balanceId,
      );
      if (balanceIndex === -1) {
        throw new Error(`Balance with ID ${action.input.balanceId} not found`);
      }

      account.endingBalances.splice(balanceIndex, 1);
    },
  };
