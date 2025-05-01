export interface PaginationParams {
    page?: number | string
    limit?: number | string
    defaultLimit?: number
  }
  
  export interface PaginationResult {
    skip: number
    limit: number
    page: number
  }
  
  export function getPaginationParams({ page = 1, limit = 20, defaultLimit = 20 }: PaginationParams): PaginationResult {
    // Convert to numbers if they're strings
    const pageNum = typeof page === "string" ? Number.parseInt(page, 10) : page
    const limitNum = typeof limit === "string" ? Number.parseInt(limit, 10) : limit
  
    // Validate and set defaults
    const validPage = pageNum > 0 ? pageNum : 1
    const validLimit = limitNum > 0 ? limitNum : defaultLimit
  
    // Calculate skip
    const skip = (validPage - 1) * validLimit
  
    return {
      skip,
      limit: validLimit,
      page: validPage,
    }
  }
  