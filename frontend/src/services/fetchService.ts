interface FetchOptions {
    headers?: HeadersInit;
    body?: any;
}

class FetchService {
    private baseUrl: string;
    constructor() {
        this.baseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    }

    private async handleResponse(response: Response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    async get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });
        return this.handleResponse(response);
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
        return this.handleResponse(response);
    }

    async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });
        return this.handleResponse(response);
    }
}

const fetchService = new FetchService();
export default fetchService;
