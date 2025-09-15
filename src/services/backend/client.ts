/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { ApiError, RequestConfig } from "../../types/backend";

export class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30_000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        if (response?.data?.signatureToken) {
          this.accessToken = response?.data?.signatureToken?.accessToken;
          this.refreshAccessToken =
            response?.data?.signatureToken?.refreshAccessToken;
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.refreshToken) {
            try {
              const response = await this.refreshAccessToken();
              this.setTokens(response.accessToken, response.refreshToken);
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              this.clearTokens();
              throw refreshError;
            }
          }
        }

        const apiError: ApiError = {
          statusCode: error.response?.status || 500,
          timestamp: new Date().toISOString(),
          path: error.config?.url || "",
          error: error.response?.statusText || "Unknown Error",
          message: error.response?.data?.message || error.message,
        };

        throw apiError;
      }
    );
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await axios.get(`${this.baseURL}/auth/refresh`, {
      data: { refreshToken: this.refreshToken },
    });
    return response.data;
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(
      url,
      data,
      config
    );
    return response.data;
  }

  async postWithFiles<T>(
    url: string,
    data?: any,
    config?: RequestConfig,
    fieldName: string = "files",
    files: File[] = []
  ): Promise<T> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "undefined" || value === null) {
          formData.delete(key);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
    }

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });

    return response.data;
  }

  async putWithFiles<T>(
    url: string,
    data?: any,
    config?: RequestConfig,
    fieldName: string = "files",
    files: File[] = []
  ): Promise<T> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "undefined" || value === null) {
          formData.delete(key);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
    }

    const response: AxiosResponse<T> = await this.client.put(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });

    return response.data;
  }

  async postWithFile<T>(
    url: string,
    data?: any,
    config?: RequestConfig,
    fieldName: string = "file",
    file?: File
  ): Promise<T> {
    const formData = new FormData();

    if (file) {
      formData.append(fieldName, file);
    }

    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "undefined" || value === null) {
          formData.delete(key);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
    }

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });

    return response.data;
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(
      url,
      data,
      config
    );
    return response.data;
  }

  // File upload helper
  async uploadFile<T>(
    url: string,
    file: File | Blob,
    fieldName: string = "file",
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (typeof value === "undefined" || value === null) {
          formData.delete(key);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
    }

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }

  // Multiple file upload helper
  async uploadFiles<T>(
    url: string,
    files: File[] | Blob[],
    fieldName: string = "files",
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (typeof value === "undefined" || value === null) {
          formData.delete(key);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
    }

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }

  // Download file helper
  async downloadFile(url: string): Promise<Blob> {
    const response = await this.client.get(url, {
      responseType: "blob",
    });

    return response.data;
  }

  // Stream data helper for large responses
  async stream<T>(
    url: string,
    onData: (chunk: T) => void,
    config?: RequestConfig
  ): Promise<void> {
    const response = await this.client.get(url, {
      ...config,
      responseType: "stream",
    });

    response.data.on("data", (chunk: Buffer) => {
      try {
        const data = JSON.parse(chunk.toString());
        onData(data);
      } catch (error) {
        console.error("Error parsing stream data:", error);
      }
    });

    return new Promise((resolve, reject) => {
      response.data.on("end", resolve);
      response.data.on("error", reject);
    });
  }
}
