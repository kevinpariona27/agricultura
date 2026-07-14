const BASE_URL = "/api";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export class NetworkError extends Error {
  constructor(message = "Network error") {
    super(message);
    this.name = "NetworkError";
  }
}

export function isNetworkError(err: unknown): boolean {
  return (
    err instanceof NetworkError ||
    (err instanceof TypeError && err.message === "Failed to fetch")
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new NetworkError();
    }
    throw err;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error ?? "Request failed", res.status, data);
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export async function uploadFile<T>(
  entity: string,
  id: number,
  file: File
): Promise<T> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${BASE_URL}/upload/${entity}/${id}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error ?? "Upload failed", res.status, data);
  }

  return data as T;
}

export async function removeImage<T>(
  entity: string,
  id: number
): Promise<T> {
  const res = await fetch(`${BASE_URL}/upload/${entity}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error ?? "Remove image failed", res.status, data);
  }

  return data as T;
}
