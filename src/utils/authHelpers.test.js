import { describe, it, expect } from 'vitest';
import * as auth from './authHelpers';

describe('authHelpers utility', () => {
  const manager = { level_otoritas: 'Manager', departemen: null };
  const spvImport = { level_otoritas: 'Supervisor', departemen: 'Import' };
  const spvDept = { level_otoritas: 'SPV Dept', departemen: 'Export' };
  const staffImport = { level_otoritas: 'Staff Dept', departemen: 'Import' };
  const staffExport = { level_otoritas: 'Staff Dept', departemen: 'Export' };
  const staffOther = { level_otoritas: 'Staff Dept', departemen: 'Account Officer' };

  it('isManager should correctly identify manager', () => {
    expect(auth.isManager(manager)).toBe(true);
    expect(auth.isManager(spvImport)).toBe(false);
    expect(auth.isManager(null)).toBe(false);
  });

  it('isSupervisor should correctly identify supervisor and SPV Dept', () => {
    expect(auth.isSupervisor(spvImport)).toBe(true);
    expect(auth.isSupervisor(spvDept)).toBe(true);
    expect(auth.isSupervisor(manager)).toBe(false);
    expect(auth.isSupervisor(staffImport)).toBe(false);
  });

  it('isOperational should correctly identify Staff Dept', () => {
    expect(auth.isOperational(staffImport)).toBe(true);
    expect(auth.isOperational(staffOther)).toBe(true);
    expect(auth.isOperational(spvImport)).toBe(false);
  });

  it('canAccessControlTower should allow supervisor', () => {
    expect(auth.canAccessControlTower(spvImport)).toBe(true);
    expect(auth.canAccessControlTower(manager)).toBe(false);
  });

  it('canAccessOperationalWorkspace should allow staff and supervisor', () => {
    expect(auth.canAccessOperationalWorkspace(staffImport)).toBe(true);
    expect(auth.canAccessOperationalWorkspace(spvImport)).toBe(true);
    expect(auth.canAccessOperationalWorkspace(manager)).toBe(false);
  });

  it('canAccessFinanceAndVendor should allow Import/Export staff and supervisors', () => {
    expect(auth.canAccessFinanceAndVendor(staffImport)).toBe(true);
    expect(auth.canAccessFinanceAndVendor(staffExport)).toBe(true);
    expect(auth.canAccessFinanceAndVendor(staffOther)).toBe(false);
    expect(auth.canAccessFinanceAndVendor(spvImport)).toBe(true);
  });

  it('canAccessImportModule should allow Import staff and supervisors', () => {
    expect(auth.canAccessImportModule(staffImport)).toBe(true);
    expect(auth.canAccessImportModule(staffExport)).toBe(false);
    expect(auth.canAccessImportModule(spvImport)).toBe(true);
  });

  it('canAccessAnalysis should allow Import staff and supervisors', () => {
    expect(auth.canAccessAnalysis(staffImport)).toBe(true);
    expect(auth.canAccessAnalysis(staffExport)).toBe(false);
    expect(auth.canAccessAnalysis(spvImport)).toBe(true);
  });

  it('canAccessStatusShipment should allow supervisors and managers', () => {
    expect(auth.canAccessStatusShipment(manager)).toBe(true);
    expect(auth.canAccessStatusShipment(spvImport)).toBe(true);
    expect(auth.canAccessStatusShipment(staffImport)).toBe(false);
  });

  it('canWriteData should allow only operational staff', () => {
    expect(auth.canWriteData(staffImport)).toBe(true);
    expect(auth.canWriteData(spvImport)).toBe(false);
    expect(auth.canWriteData(manager)).toBe(false);
  });

  it('canWritePayment and canWriteVendor should combine logic correctly', () => {
    expect(auth.canWritePayment(staffImport)).toBe(true);
    expect(auth.canWritePayment(staffExport)).toBe(true);
    expect(auth.canWritePayment(staffOther)).toBe(false);
    expect(auth.canWritePayment(spvImport)).toBe(false); // Can access, but cannot write

    expect(auth.canWriteVendor(staffImport)).toBe(true);
    expect(auth.canWriteVendor(spvImport)).toBe(false);
  });

  it('canViewAcrossDept and canViewAllInDept should allow supervisor and manager', () => {
    expect(auth.canViewAcrossDept(manager)).toBe(true);
    expect(auth.canViewAcrossDept(spvImport)).toBe(true);
    expect(auth.canViewAcrossDept(staffImport)).toBe(false);

    expect(auth.canViewAllInDept(manager)).toBe(true);
    expect(auth.canViewAllInDept(spvImport)).toBe(true);
    expect(auth.canViewAllInDept(staffImport)).toBe(false);
  });

  it('getUserDisplayLabel should return correct label', () => {
    expect(auth.getUserDisplayLabel(null)).toBe('—');
    expect(auth.getUserDisplayLabel(manager)).toBe('Manager');
    expect(auth.getUserDisplayLabel(spvImport)).toBe('Supervisor');
    expect(auth.getUserDisplayLabel(staffImport)).toBe('Staff Dept · Import');
  });

  it('getSupervisorPageTitle should return correct title', () => {
    expect(auth.getSupervisorPageTitle('Dashboard', spvImport)).toBe('Dashboard - Departemen Import');
    expect(auth.getSupervisorPageTitle('Dashboard', manager)).toBe('Dashboard');
    expect(auth.getSupervisorPageTitle('Dashboard', staffImport)).toBe('Dashboard');
  });
});
