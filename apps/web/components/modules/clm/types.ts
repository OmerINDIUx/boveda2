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
  isPartial?: boolean;
  sectionErrors?: Record<string, string>;
  versions: Array<{
    id: string;
    versionLabel: string;
    fileName: string;
    fileExtension?: string;
    mimeType: string;
    sizeBytes: number | string;
    changeSummary?: string;
    createdAt: string;
    uploadedBy?: { id: string; name: string; email: string } | null;
  }>;
  currentVersion?: ContractDetail['versions'][number] | null;
  attachments: Array<{
    id: string;
    name: string;
    attachmentGroupId: string;
    versionLabel: string;
    isCurrent: boolean;
    fileName: string;
    fileExtension?: string;
    mimeType: string;
    sizeBytes: number | string;
    notes?: string;
    createdAt: string;
    uploadedBy?: { id: string; name: string; email?: string } | null;
  }>;
  obligations: Array<{
    id: string;
    description: string;
    commitmentDate?: string;
    status: string;
    comments?: string;
    responsibleUser?: { name: string } | null;
    updatedAt?: string;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    milestoneDate: string;
    status: string;
    notes?: string;
    responsibleUser?: { name: string } | null;
    completedAt?: string;
    updatedAt?: string;
  }>;
  deliverables: Array<{
    id: string;
    name: string;
    description?: string;
    dueDate?: string;
    acceptanceCriteria?: string;
    status: string;
    responsibleUser?: { name: string } | null;
    deliveredAt?: string;
    acceptedAt?: string;
    updatedAt?: string;
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
    amount?: string;
    currency: string;
    percentage?: string;
    paymentCondition?: string;
    paymentDate?: string;
    dueDate?: string;
    status: string;
    invoiceNumber?: string;
    invoiceFileKey?: string;
    notes?: string;
    erpExternalId?: string;
    erpSyncStatus?: string;
    erpSyncError?: string;
    erpSyncedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  signatures: Array<{
    id: string;
    versionId?: string;
    attachmentId?: string;
    provider: string;
    status: string;
    signersJson: unknown;
    signedAt?: string;
    createdAt: string;
    createdBy?: { id: string; name: string } | null;
    version?: { id: string; versionLabel: string; fileName: string } | null;
    attachment?: { id: string; name: string; versionLabel: string; fileName: string } | null;
  }>;
  negotiations: Array<{
    id: string;
    partyName: string;
    status: string;
    proposedText?: string;
    originalText?: string;
    createdAt: string;
    updatedAt?: string;
    resolvedAt?: string;
    createdBy?: { id: string; name: string; email?: string } | null;
    version?: { id: string; versionLabel: string; fileName: string } | null;
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
  context?: {
    mode: 'persisted_contract_knowledge' | string;
    documentsSearched?: number;
    approvedFactsUsed: number;
    transcriptionChunksUsed: number;
    fileRead: boolean;
    searchLanguages?: Array<'es' | 'en'>;
  };
  citations: Array<{ sourceType: string; label: string; fragment: string }>;
};

export type ContractExtractionFact = {
  id: string;
  category:
    | 'general'
    | 'dates'
    | 'parties'
    | 'penalties'
    | 'guarantees'
    | 'deliverables'
    | 'obligations'
    | 'payments'
    | 'milestones'
    | 'risks';
  field: string;
  label: string;
  value: string | number | boolean | Record<string, unknown>;
  confidence: number;
  pageNumber?: number;
  evidence?: string;
  decision: 'pending' | 'accepted' | 'rejected';
};

export type ContractExtractionRun = {
  id: string;
  contractId: string;
  versionId?: string;
  attachmentId?: string;
  uploadedById: string;
  status: 'queued' | 'processing' | 'draft_ready' | 'under_review' | 'approved' | 'failed';
  progressPercent: number;
  processingStage: string;
  facts: ContractExtractionFact[];
  error?: string;
  modelName?: string;
  checkpoint?: {
    stage: 'indexing_text' | 'extracting_facts' | 'draft_ready';
    completedBatches: number;
    totalBatches: number;
    savedAt: string;
  };
  processedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
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
