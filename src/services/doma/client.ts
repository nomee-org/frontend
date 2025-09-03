import { domaQLClient } from "@/configs/doma";

interface GraphResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function graphRequest<T>(
  query: string,
  variables?: Record<string, string | number | boolean | object>
): Promise<T> {
  const res = await domaQLClient.post("/", { query, variables });

  if (res.status !== 200) {
    throw new Error(`GraphQL request failed with status ${res.status}`);
  }

  const data = res.data as GraphResponse<T>;

  if (data.errors && data.errors.length) {
    throw new Error(data.errors.map((e) => e.message).join("; "));
  }

  return data.data as T;
}
