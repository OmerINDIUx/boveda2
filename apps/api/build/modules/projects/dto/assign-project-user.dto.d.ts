export declare class AssignProjectUserDto {
  userId: string;
  role: 'owner' | 'manager' | 'contributor' | 'viewer';
  canManageDocuments?: boolean;
  canManageContracts?: boolean;
}
