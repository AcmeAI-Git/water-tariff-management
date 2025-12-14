import type { ApiResponse } from "../types";

interface FetchOptions {
    headers?: HeadersInit;
    timeout?: number; // Timeout in milliseconds
}

class FetchService {
    private baseUrl: string;
    private defaultTimeout: number = 30000; // 30 seconds default timeout

    constructor() {
        // Use production API URL by default
        this.baseUrl =
            import.meta.env.VITE_API_BASE_URL || 
            "https://water-tariff-backend.onrender.com";
    }

    /**
     * Creates a fetch request with timeout
     */
    private async fetchWithTimeout(
        url: string,
        options: RequestInit,
        timeout: number = this.defaultTimeout
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout: The server took too long to respond (${timeout}ms)`);
            }
            throw error;
        }
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const data: ApiResponse<T> & { errors?: any[] } = await response.json();
        
        if (!response.ok || data.status === 'error') {
            let errorMessage = data.message || `HTTP error! status: ${response.status}`;
            
            // Include validation errors if present
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                const validationErrors = data.errors.map((err: any) => {
                    if (typeof err === 'string') return err;
                    if (err.property && err.constraints) {
                        return `${err.property}: ${Object.values(err.constraints).join(', ')}`;
                    }
                    return JSON.stringify(err);
                }).join('; ');
                errorMessage = `${errorMessage} - ${validationErrors}`;
            }
            
            throw new Error(errorMessage);
        }
        
        // Return the data property if it exists, otherwise return the whole response
        return (data.data ?? data) as T;
    }

    async get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const { timeout = this.defaultTimeout, ...fetchOptions } = options;
        const response = await this.fetchWithTimeout(
            `${this.baseUrl}${endpoint}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...fetchOptions.headers,
                },
            },
            timeout
        );
        return this.handleResponse<T>(response);
    }

    async post<T>(
        endpoint: string,
        data: any,
        options: FetchOptions = {}
    ): Promise<T> {
        const { timeout = this.defaultTimeout, ...fetchOptions } = options;
        const response = await this.fetchWithTimeout(
            `${this.baseUrl}${endpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...fetchOptions.headers,
                },
                body: JSON.stringify(data),
            },
            timeout
        );
        return this.handleResponse<T>(response);
    }

    async put<T>(
        endpoint: string,
        data: any,
        options: FetchOptions = {}
    ): Promise<T> {
        const { timeout = this.defaultTimeout, ...fetchOptions } = options;
        const response = await this.fetchWithTimeout(
            `${this.baseUrl}${endpoint}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...fetchOptions.headers,
                },
                body: JSON.stringify(data),
            },
            timeout
        );
        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const { timeout = this.defaultTimeout, ...fetchOptions } = options;
        const response = await this.fetchWithTimeout(
            `${this.baseUrl}${endpoint}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    ...fetchOptions.headers,
                },
            },
            timeout
        );
        return this.handleResponse<T>(response);
    }
}

const fetchService = new FetchService();
export default fetchService;
