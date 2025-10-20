// API client and types for the deals backend

export interface Owner {
  id: string
  name: string
}

export type DealStage =
  | 'Prospect'
  | 'Application'
  | 'Underwriting'
  | 'CreditMemo'
  | 'Docs'
  | 'Approved'
  | 'Closed'
  | 'Declined'

export type ProductType =
  | 'TermLoan'
  | 'LineOfCredit'
  | 'SBA7a'
  | 'Equipment'
  | 'CRE'

export interface Deal {
  id: string
  name: string
  borrowerId: string
  owner: Owner
  product: ProductType
  stage: DealStage
  requestedAmount: number
  probability: number
  riskScore: number | null
  dscr: number | null
  ltv: number | null
  docsProgress: number | null
  flags: Array<string>
  createdAt: string
  updatedAt: string
}

export interface DealsResponse {
  items: Array<Deal>
  nextCursor: string | null
}

export interface UpdateDealRequest {
  stage?: DealStage
  ownerId?: string
  probability?: number
  riskScore?: number
}

export interface DealsQueryParams {
  search?: string
  stage?: string
  ownerId?: string
  product?: string
  minAmt?: number
  maxAmt?: number
  sort?: string
  order?: 'asc' | 'desc'
  limit?: number
  cursor?: string
}

export type DocStatus =
  | 'pending'
  | 'requested'
  | 'received'
  | 'verified'
  | 'rejected'
  | 'waived'

export interface Borrower {
  id: string
  legalName: string
  industry: string | null
  naics: string | null
  address: string | null
  existingRelationship: boolean
  deposits: number | null
}

export interface Financial {
  borrowerId: string
  period: string
  periodEnd: string
  revenue: number
  ebitda: number
  debtService: number
}

export interface DocumentRequest {
  id: string
  dealId: string
  label: string
  type: string
  requiredBy: string | null
  status: DocStatus
  link: string | null
  requestedAt: string
}

export interface ActivityEvent {
  id: string
  type: string
  at: string
  dealId: string
  payload: Record<string, any>
}

export interface TermSheet {
  id: string
  dealId: string
  baseRate: string
  marginBps: number
  amortMonths: number
  interestOnlyMonths: number
  originationFeeBps: number
  prepayPenalty: string | null
  collateral: string | null
  covenants: Array<string> | null
  conditions: Array<string> | null
  lastEditedAt: string
}

export interface Suggestion {
  id: string
  dealId: string
  severity: 'info' | 'warning' | 'critical'
  text: string
  inputs?: Record<string, any>
}

export interface TermSheetSuggestionsQuery {
  amount?: number
  rate?: number
  amort?: number
  term?: number
}

const API_BASE_URL = 'http://localhost:8000'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo', // Using demo token as configured in backend
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new ApiError(response.status, errorText)
  }

  return response.json()
}

export const dealsApi = {
  // Get deals with optional filtering and pagination
  getDeals: async (params: DealsQueryParams = {}): Promise<DealsResponse> => {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const queryString = searchParams.toString()
    const endpoint = `/deals${queryString ? `?${queryString}` : ''}`

    return apiRequest<DealsResponse>(endpoint)
  },

  // Get a single deal by ID
  getDeal: async (dealId: string): Promise<Deal> => {
    return apiRequest<Deal>(`/deals/${dealId}`)
  },

  // Update a deal
  updateDeal: async (
    dealId: string,
    updates: UpdateDealRequest,
  ): Promise<Deal> => {
    return apiRequest<Deal>(`/deals/${dealId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  // Get borrower information
  getBorrower: async (borrowerId: string): Promise<Borrower> => {
    return apiRequest<Borrower>(`/borrowers/${borrowerId}`)
  },

  // Get borrower financials
  getBorrowerFinancials: async (
    borrowerId: string,
    params: { period?: string; fromYear?: number; toYear?: number } = {},
  ): Promise<Array<Financial>> => {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, value.toString())
    }
    const queryString = searchParams.toString()
    const endpoint = `/borrowers/${borrowerId}/financials${queryString ? `?${queryString}` : ''}`
    return apiRequest<Array<Financial>>(endpoint)
  },

  // Get deal documents/checklist
  getDealDocuments: async (
    dealId: string,
  ): Promise<{ items: Array<DocumentRequest> }> => {
    return apiRequest<{ items: Array<DocumentRequest> }>(
      `/deals/${dealId}/documents`,
    )
  },

  // Get deal checklist
  getDealChecklist: async (
    dealId: string,
  ): Promise<{ items: Array<DocumentRequest> }> => {
    return apiRequest<{ items: Array<DocumentRequest> }>(
      `/deals/${dealId}/checklist`,
    )
  },

  // Request a document
  requestDocument: async (
    dealId: string,
    document: { label: string; type: string; requiredBy?: string },
  ): Promise<DocumentRequest> => {
    return apiRequest<DocumentRequest>(`/deals/${dealId}/documents`, {
      method: 'POST',
      body: JSON.stringify(document),
    })
  },

  // Get deal activity/events
  getDealActivity: async (
    dealId: string,
  ): Promise<{ items: Array<ActivityEvent> }> => {
    const events = await apiRequest<Array<ActivityEvent>>(
      `/deals/${dealId}/activity`,
    )
    return { items: events }
  },

  // Get term sheet
  getTermSheet: async (dealId: string): Promise<TermSheet> => {
    return apiRequest<TermSheet>(`/deals/${dealId}/term-sheet`)
  },

  // Update term sheet
  updateTermSheet: async (
    dealId: string,
    termSheet: TermSheet,
  ): Promise<TermSheet> => {
    return apiRequest<TermSheet>(`/deals/${dealId}/term-sheet`, {
      method: 'PUT',
      body: JSON.stringify(termSheet),
    })
  },

  // Get term sheet suggestions
  getTermSheetSuggestions: async (
    dealId: string,
    query: TermSheetSuggestionsQuery = {},
  ): Promise<{ suggestions: Array<Suggestion> }> => {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    }
    const queryString = searchParams.toString()
    const endpoint = `/deals/${dealId}/term-sheet/suggestions${
      queryString ? `?${queryString}` : ''
    }`
    return apiRequest<{ suggestions: Array<Suggestion> }>(endpoint)
  },

  // Optimize term sheet
  optimizeTermSheet: async (dealId: string): Promise<{ jobId: string }> => {
    return apiRequest<{ jobId: string }>(
      `/deals/${dealId}/term-sheet/optimize`,
      {
        method: 'POST',
      },
    )
  },
}

export default dealsApi
