import type { ApiResponse } from "../types";

interface FetchOptions {
    headers?: HeadersInit;
    body?: any;
}

class FetchService {
    private baseUrl: string;
    constructor() {
        // Use production API URL by default
        this.baseUrl =
            import.meta.env.VITE_API_BASE_URL || 
            "https://water-tariff-backend.onrender.com";
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const data: ApiResponse<T> = await response.json();
        
        if (!response.ok || data.status === 'error') {
            const errorMessage = data.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        // Return the data property if it exists, otherwise return the whole response
        return (data.data ?? data) as T;
    }

    async get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });
        return this.handleResponse<T>(response);
    }

    async post<T>(
        endpoint: string,
        data: any,
        options: FetchOptions = {}
    ): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            body: JSON.stringify(data),
        });
        return this.handleResponse<T>(response);
    }

    async put<T>(
        endpoint: string,
        data: any,
        options: FetchOptions = {}
    ): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            body: JSON.stringify(data),
        });
        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });
        return this.handleResponse<T>(response);
    }
}

const fetchService = new FetchService();
export default fetchService;
