import { ContractShell } from '../../../components/modules/clm/contract-shell';

export default function ContractRouteLayout({ children }: { children: React.ReactNode }) {
  return <ContractShell>{children}</ContractShell>;
}
