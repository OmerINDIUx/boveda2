import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionKey } from '../permissions';
import { PermissionsGuard } from './permissions.guard';

function context(roles: string[], permissions: string[]) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          roles,
          permissions,
        },
      }),
    }),
  } as unknown as ExecutionContext;
}

function guardFor(required: string[]) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(required),
  } as unknown as Reflector;
  return new PermissionsGuard(reflector);
}

describe('PermissionsGuard por roles CLM', () => {
  it('permite al administrador de plataforma sin permisos individuales', () => {
    expect(guardFor([PermissionKey.ClmFinance]).canActivate(context(['admin'], []))).toBe(true);
  });

  it('no permite a un gestor de contratos operar finanzas sin clm.finance', () => {
    expect(
      guardFor([PermissionKey.ClmFinance]).canActivate(
        context(['contract_manager'], [PermissionKey.ContractsManage])
      )
    ).toBe(false);
  });

  it('permite al rol financiero sincronizar ERP pero no enviar a firma', () => {
    expect(
      guardFor([PermissionKey.ClmFinance]).canActivate(
        context(['clm_finance'], [PermissionKey.ContractsManage, PermissionKey.ClmFinance])
      )
    ).toBe(true);
    expect(
      guardFor([PermissionKey.ClmSign]).canActivate(
        context(['clm_finance'], [PermissionKey.ContractsManage, PermissionKey.ClmFinance])
      )
    ).toBe(false);
  });

  it('permite al firmante enviar a firma sin concederle finanzas', () => {
    expect(
      guardFor([PermissionKey.ClmSign]).canActivate(
        context(['clm_signer'], [PermissionKey.ContractsManage, PermissionKey.ClmSign])
      )
    ).toBe(true);
    expect(
      guardFor([PermissionKey.ClmFinance]).canActivate(
        context(['clm_signer'], [PermissionKey.ContractsManage, PermissionKey.ClmSign])
      )
    ).toBe(false);
  });
});
