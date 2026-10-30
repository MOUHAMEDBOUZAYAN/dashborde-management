import { api } from "@/lib/api";

export const metaStatusQueryKey = ["client", "meta", "status"] as const;

export type MetaPage = {
  page_id: string;
  page_name: string;
};

export type MetaForm = {
  form_id: string;
  form_name: string;
  page_id: string;
  is_linked: boolean;
};

export type MetaStatus = {
  connected: boolean;
  fb_user_id?: string;
  pages: MetaPage[];
  forms: MetaForm[];
};

export type MetaCallbackResult = {
  connected: boolean;
  pages: MetaPage[];
  forms: MetaForm[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

function readPage(value: unknown): MetaPage {
  if (!isRecord(value)) {
    throw new Error("Réponse page Meta invalide.");
  }

  return {
    page_id: asString(value.page_id ?? value.id ?? value.pageId),
    page_name: asString(
      value.page_name ?? value.name ?? value.pageName,
      "Page sans nom",
    ),
  };
}

function readForm(value: unknown): MetaForm {
  if (!isRecord(value)) {
    throw new Error("Réponse formulaire Meta invalide.");
  }

  return {
    form_id: asString(value.form_id ?? value.id ?? value.formId),
    form_name: asString(
      value.form_name ?? value.name ?? value.formName,
      "Formulaire sans nom",
    ),
    page_id: asString(value.page_id ?? value.pageId),
    is_linked: asBoolean(value.is_linked ?? value.isLinked),
  };
}

function readPages(value: unknown): MetaPage[] {
  if (!Array.isArray(value)) return [];
  return value.map(readPage);
}

function readForms(value: unknown): MetaForm[] {
  if (!Array.isArray(value)) return [];
  return value.map(readForm);
}

function readStatus(data: unknown): MetaStatus {
  if (!isRecord(data)) {
    throw new Error("Réponse statut Meta invalide.");
  }

  const fbUserIdRaw = data.fb_user_id ?? data.fbUserId;
  const fb_user_id =
    fbUserIdRaw == null || fbUserIdRaw === ""
      ? undefined
      : asString(fbUserIdRaw);

  return {
    connected: asBoolean(data.connected),
    fb_user_id,
    pages: readPages(data.pages),
    forms: readForms(data.forms),
  };
}

function readCallbackResult(data: unknown): MetaCallbackResult {
  if (!isRecord(data)) {
    throw new Error("Réponse callback Meta invalide.");
  }

  return {
    connected: asBoolean(data.connected, true),
    pages: readPages(data.pages),
    forms: readForms(data.forms),
  };
}

function readConnectUrl(data: unknown): string {
  if (!isRecord(data)) {
    throw new Error("Réponse URL Meta invalide.");
  }

  const url = data.url;
  if (typeof url === "string" && url.trim()) return url.trim();
  throw new Error("URL de connexion Meta manquante.");
}

export async function getMetaConnectUrl(): Promise<string> {
  const { data } = await api.get<unknown>("/client/meta/connect-url");
  return readConnectUrl(data);
}

export async function sendMetaCallback(
  code: string,
  state: string,
): Promise<MetaCallbackResult> {
  const { data } = await api.post<unknown>("/client/meta/callback", {
    code,
    state,
  });
  return readCallbackResult(data);
}

export async function getMetaStatus(): Promise<MetaStatus> {
  const { data } = await api.get<unknown>("/client/meta/status");
  return readStatus(data);
}

export async function toggleMetaForm(
  formId: string,
  isLinked: boolean,
): Promise<MetaForm> {
  const { data } = await api.patch<unknown>(
    `/client/meta/forms/${encodeURIComponent(formId)}`,
    { is_linked: isLinked },
  );

  if (isRecord(data) && (data.form || data.data)) {
    const nested = data.form ?? data.data;
    if (!Array.isArray(nested)) return readForm(nested);
  }

  if (isRecord(data) && (data.form_id || data.id || data.formId)) {
    return readForm(data);
  }

  return {
    form_id: formId,
    form_name: "",
    page_id: "",
    is_linked: isLinked,
  };
}

export async function disconnectMeta(): Promise<void> {
  await api.delete("/client/meta/connection");
}
