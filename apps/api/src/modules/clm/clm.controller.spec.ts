import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { PermissionKey } from '../../common/permissions';
import { ClmController } from './clm.controller';

describe('ClmController permissions', () => {
  it('protege la sincronización y prueba del ERP con el permiso financiero', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, ClmController.prototype.syncPaymentToErp)).toEqual([
      PermissionKey.ClmFinance,
    ]);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, ClmController.prototype.testErpConnection)).toEqual(
      [PermissionKey.ClmFinance]
    );
  });

  it('protege la firma con el permiso específico de firma', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, ClmController.prototype.sendForSignature)).toEqual([
      PermissionKey.ClmSign,
    ]);
  });

  it('mantiene público el webhook para que DocuSign pueda entregar eventos', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, ClmController.prototype.docusignWebhook)).toBe(true);
  });
});
