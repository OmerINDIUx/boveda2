export interface RequestUser {
    id: string;
    email: string;
    name?: string;
    active?: boolean;
    roles: string[];
    permissions: string[];
}
