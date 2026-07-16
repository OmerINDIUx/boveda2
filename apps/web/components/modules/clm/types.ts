export type Project = {
  id: string;
  name: string;
  code: string;
  workType?: string;
  currentStage?: string;
  targetDate?: string;
  responsible?: { id: string; name: string; email: string } | null;
};

export type Tag = { id: string; name: string; color?: string };

export type ContractListItem = {
  id: string;
  name: string;
  projectId: string;
  supplierName?: string;
  clientName?: string;
  responsibleArea?: string;
  contractType?: string;
  status: string;
  lifecycleStage?: string;
  lifecycleChangedAt?: string;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  amount?: string;
  currency: string;
  project?: Project;
  pendingObligations?: number;
  tags?: Tag[];
  responsibleUserId?: string;
  mainDocumentId?: string;
  currentVersionId?: string;
  renewable?: boolean;
  renewalNoticeDays?: number;
  alertDaysBefore?: number;
  parentContractId?: string;
  closeReason?: string;
  closedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ContractDetail = ContractListItem & {
  versions: Array<{
    id: string;
    versionLabel: string;
    fileName: string;
    changeSummary?: string;
    createdAt: string;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    fileName: string;
    notes?: string;
    createdAt: string;
  }>;
  obligations: Array<{
    id: string;
    description: string;
    commitmentDate?: string;
    status: string;
    comments?: string;
    responsibleUser?: { name: string } | null;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    milestoneDate: string;
    status: string;
    notes?: string;
    responsibleUser?: { name: string } | null;
  }>;
  comments: Array<{ id: string; body: string; createdAt: string; author: { name: string } | null }>;
  audit: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor?: { id: string; name: string } | null;
  }>;
  amendments: Array<{
    id: string;
    amendmentNumber: string;
    title: string;
    description?: string;
    amendmentDate: string;
    status: string;
  }>;
  payments: Array<{
    id: string;
    concept: string;
    amount: string;
    currency: string;
    paymentDate?: string;
    dueDate?: string;
    status: string;
    invoiceNumber?: string;
  }>;
  signatures: Array<{
    id: string;
    provider: string;
    status: string;
    signersJson: any;
    signedAt?: string;
    createdAt: string;
    createdBy?: { id: string; name: string } | null;
  }>;
  negotiations: Array<{
    id: string;
    partyName: string;
    status: string;
    proposedText?: string;
    originalText?: string;
    createdAt: string;
  }>;
  tags: Tag[];
  customValues: Array<{
    id: string;
    fieldId: string;
    value?: string;
    field: { fieldKey: string; fieldLabel: string; fieldType: string };
  }>;
  childrenContracts: Array<{ id: string; name: string; status: string }>;
  lifecycleHistory: Array<{
    id: string;
    previousStage?: string;
    stage: string;
    comments?: string;
    decision?: string;
    createdAt: string;
    timeInPreviousStageMinutes?: number;
    changedBy?: { id: string; name: string; email?: string } | null;
    relatedDocument?: { id: string; name: string; documentNumber?: string } | null;
    relatedVersion?: { id: string; versionLabel: string; fileName: string } | null;
  }>;
};

export type AskResponse = {
  answer: string;
  status: string;
  citations: Array<{ sourceType: string; label: string; fragment: string }>;
};

export type FilePayload = {
  fileName: string;
  mimeType: string;
  base64Content: string;
  sizeBytes: number;
};

export type RiskDimension = {
  score: number;
  weight: number;
  label: string;
  level?: 'low' | 'medium' | 'high' | 'critical';
};

export type RiskMatrix = {
  overallScore: number;
  overallLevel: 'low' | 'medium' | 'high' | 'critical';
  dimensions: Record<string, RiskDimension>;
  indicators?: {
    overdueObligations: number;
    totalObligations: number;
    overduePayments: number;
    totalPayments: number;
    contractAmount: number;
    contractStatus: string;
  };
};

export type TextSearchResult = {
  contractId: string;
  contractName: string;
  snippet: string;
  versionId?: string;
  score: number;
};

export type SearchResponse = {
  contracts: ContractListItem[];
  total: number;
  page: number;
  limit: number;
  textResults: TextSearchResult[];
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
