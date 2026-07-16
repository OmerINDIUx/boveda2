import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AskContractQueryDto } from './dto/ask-contract-query.dto';
import { AssignTagsDto } from './dto/assign-tags.dto';
import { BatchActionDto } from './dto/batch-action.dto';
import { CloseContractDto } from './dto/close-contract.dto';
import { ContractSearchDto } from './dto/contract-search.dto';
import { CreateAmendmentDto } from './dto/create-amendment.dto';
import { CreateContractAttachmentDto } from './dto/create-contract-attachment.dto';
import { CreateClauseDto } from './dto/create-clause.dto';
import { CreateContractCommentDto } from './dto/create-contract-comment.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateContractMilestoneDto } from './dto/create-contract-milestone.dto';
import { CreateContractObligationDto } from './dto/create-contract-obligation.dto';
import { CreateContractVersionDto } from './dto/create-contract-version.dto';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { CreateNegotiationDto } from './dto/create-negotiation.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateSignatureRequestDto } from './dto/create-signature-request.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ImportContractsDto } from './dto/import-contracts.dto';
import { RenewContractDto } from './dto/renew-contract.dto';
import { SetCustomValueDto } from './dto/set-custom-value.dto';
import { UpdateAmendmentDto } from './dto/update-amendment.dto';
import { UpdateContractMilestoneDto } from './dto/update-contract-milestone.dto';
import { UpdateContractObligationDto } from './dto/update-contract-obligation.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ClmService } from './clm.service';
export declare class ClmController {
    private readonly clm;
    constructor(clm: ClmService);
    list(user: RequestUser, search?: ContractSearchDto): Promise<{
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
        tags: import("./entities/tag.entity").Tag[];
    }[]>;
    create(user: RequestUser, dto: CreateContractDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    detail(user: RequestUser, id: string): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    update(user: RequestUser, id: string, dto: UpdateContractDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    createVersion(user: RequestUser, id: string, dto: CreateContractVersionDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    addAttachment(user: RequestUser, id: string, dto: CreateContractAttachmentDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    addObligation(user: RequestUser, id: string, dto: CreateContractObligationDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    updateObligation(user: RequestUser, id: string, obligationId: string, dto: UpdateContractObligationDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    addMilestone(user: RequestUser, id: string, dto: CreateContractMilestoneDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    updateMilestone(user: RequestUser, id: string, milestoneId: string, dto: UpdateContractMilestoneDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    addComment(user: RequestUser, id: string, dto: CreateContractCommentDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    close(user: RequestUser, id: string, dto: CloseContractDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    renew(user: RequestUser, id: string, dto: RenewContractDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    ask(user: RequestUser, id: string, dto: AskContractQueryDto): Promise<{
        answer: string;
        status: string;
        citations: {
            sourceType: string;
            label: string;
            fragment: string;
        }[];
    }>;
    addAmendment(user: RequestUser, id: string, dto: CreateAmendmentDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    updateAmendment(user: RequestUser, id: string, amendmentId: string, dto: UpdateAmendmentDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    addPayment(user: RequestUser, id: string, dto: CreatePaymentDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    updatePayment(user: RequestUser, id: string, paymentId: string, dto: UpdatePaymentDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    sendForSignature(user: RequestUser, id: string, dto: CreateSignatureRequestDto): Promise<{
        signature: import("./entities/contract-signature-request.entity").ContractSignatureRequest;
        signingUrl: string | undefined;
    }>;
    checkSignatureStatus(user: RequestUser, id: string, signatureId: string): Promise<import("./entities/contract-signature-request.entity").ContractSignatureRequest>;
    addNegotiation(user: RequestUser, id: string, dto: CreateNegotiationDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    updateNegotiation(user: RequestUser, id: string, negotiationId: string, dto: UpdateNegotiationDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    assignTags(user: RequestUser, id: string, dto: AssignTagsDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    setCustomValue(user: RequestUser, id: string, dto: SetCustomValueDto): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    setCustomValues(user: RequestUser, id: string, values: SetCustomValueDto[]): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    setParent(user: RequestUser, id: string, parentContractId: string | null): Promise<{
        currentVersion: import("./contract-version.entity").ContractVersion;
        versions: import("./contract-version.entity").ContractVersion[];
        attachments: import("./contract-attachment.entity").ContractAttachment[];
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: import("./contract-audit-log.entity").ContractAuditLog[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
        signatures: {
            id: string;
            provider: string;
            status: string;
            signersJson: Record<string, unknown>;
            signedAt: Date | undefined;
            createdAt: Date;
            createdBy: {
                id: string;
                name: string;
            } | null;
        }[];
        negotiations: import("./entities/contract-negotiation.entity").ContractNegotiation[];
        tags: import("./entities/tag.entity").Tag[];
        customValues: import("./entities/contract-custom-value.entity").ContractCustomValue[];
        childrenContracts: {
            id: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "active" | "expiring_soon" | "expired" | "renewed" | "closed";
        }[];
        id: string;
        name: string;
        projectId: string;
        supplierName: string | undefined;
        clientName: string | undefined;
        responsibleArea: string | undefined;
        contractType: string | undefined;
        status: string;
        startDate: string | undefined;
        endDate: string | undefined;
        renewalDate: string | undefined;
        amount: string | undefined;
        currency: string;
        responsibleUserId: string | undefined;
        mainDocumentId: string | undefined;
        currentVersionId: string | undefined;
        renewable: boolean;
        renewalNoticeDays: number | undefined;
        alertDaysBefore: number | undefined;
        parentContractId: string | undefined;
        closeReason: string | undefined;
        closedAt: Date | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        responsibleUser: import("../users/user.entity").User | undefined;
        mainDocument: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        pendingObligations: number;
    }>;
    batch(user: RequestUser, dto: BatchActionDto): Promise<{
        results: {
            id: string;
            ok: boolean;
            error?: string;
        }[];
        total: number;
        success: number;
        failed: number;
    }>;
    importContracts(user: RequestUser, dto: ImportContractsDto): Promise<{
        total: number;
        success: number;
        errors: {
            row: number;
            message: string;
        }[];
        log: {
            fileName: string;
            totalRows: number;
            successRows: number;
            errorRows: number;
        };
    }>;
    exportContract(user: RequestUser, id: string): Promise<{
        contract: {
            name: string;
            status: string;
            supplierName: string | undefined;
            clientName: string | undefined;
            contractType: string | undefined;
            responsibleArea: string | undefined;
            startDate: string | undefined;
            endDate: string | undefined;
            amount: string | undefined;
            currency: string;
        };
        obligations: import("./contract-obligation.entity").ContractObligation[];
        milestones: import("./contract-milestone.entity").ContractMilestone[];
        versions: import("./contract-version.entity").ContractVersion[];
        tags: import("./entities/tag.entity").Tag[];
        amendments: import("./entities/contract-amendment.entity").ContractAmendment[];
        payments: import("./entities/contract-payment.entity").ContractPayment[];
    }>;
    syncAlerts(user: RequestUser, projectId?: string): Promise<{
        ok: boolean;
        alertsCreated: number;
        contractsProcessed: number;
    }>;
    dashboard(user: RequestUser, projectId?: string): Promise<{
        contractsByStatus: never[];
        contractsByType: never[];
        expiringThisMonth: number;
        totalAmount: number;
        pendingObligations: number;
        activeContracts: number;
        totalContracts?: undefined;
    } | {
        contractsByStatus: {
            key: string;
            value: number;
        }[];
        contractsByType: {
            label: string;
            value: number;
        }[];
        expiringThisMonth: number;
        totalAmount: number;
        pendingObligations: number;
        activeContracts: number;
        totalContracts: number;
    }>;
    report(user: RequestUser, dto: CreateReportDto): Promise<import("./reports/report-types").ReportResult>;
    listTags(): Promise<import("./entities/tag.entity").Tag[]>;
    createTag(dto: CreateTagDto): Promise<import("./entities/tag.entity").Tag>;
    deleteTag(id: string): Promise<{
        ok: boolean;
    }>;
    listCustomFields(contractType?: string): Promise<import("./entities/contract-custom-field.entity").ContractCustomField[]>;
    createCustomField(dto: CreateCustomFieldDto): Promise<import("./entities/contract-custom-field.entity").ContractCustomField>;
    deleteCustomField(id: string): Promise<{
        ok: boolean;
    }>;
    listTemplates(): Promise<import("./entities/contract-template.entity").ContractTemplate[]>;
    createTemplate(user: RequestUser, dto: CreateTemplateDto): Promise<import("./entities/contract-template.entity").ContractTemplate>;
    templateDetail(id: string): Promise<{
        clauses: any;
        id: string;
        name: string;
        description?: string;
        contractType?: string;
        isActive: boolean;
        createdById: string;
        createdBy: import("../users/user.entity").User;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listClauses(category?: string): Promise<import("./entities/contract-clause.entity").ContractClause[]>;
    createClause(user: RequestUser, dto: CreateClauseDto): Promise<import("./entities/contract-clause.entity").ContractClause>;
    importLogs(user: RequestUser): Promise<import("./entities/contract-import-log.entity").ContractImportLog[]>;
}
