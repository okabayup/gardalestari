'use server';

// data-bank.ts and bank-data.ts appear to be duplicates.
// This file re-exports from bank-data.ts for backward compatibility.
export {
  searchDataBank,
  getDataBankEntries,
  getDataBankEntry,
  createDataBankEntry,
  updateDataBankEntry,
  deleteDataBankEntry,
} from './bank-data';
