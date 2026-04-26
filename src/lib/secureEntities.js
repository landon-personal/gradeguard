/**
 * Secure entity wrapper that routes all CRUD operations through the
 * JWT-authenticated entityProxy backend function.
 *
 * Drop-in replacement for base44.entities.EntityName.method() calls.
 * Usage:
 *   import { secureEntity } from "@/lib/secureEntities";
 *   const results = await secureEntity("GamificationStats").filter({ user_email }, token);
 */
import { base44 } from "@/api/base44Client";

function getToken() {
  return localStorage.getItem("gg_auth_token");
}

function handleExpired(res) {
  if (res?.data?.error === "TOKEN_EXPIRED") {
    localStorage.removeItem("gg_user_email");
    localStorage.removeItem("gg_auth_token");
    window.location.href = "/?session_expired=1";
    throw new Error("Session expired");
  }
}

export function secureEntity(entityName) {
  return {
    async list(sort, limit) {
      const token = getToken();
      const res = await base44.functions.invoke("entityProxy", {
        token, action: "list", entity: entityName, sort, limit
      });
      handleExpired(res);
      return res.data.result;
    },
    async filter(filterObj, sort, limit) {
      const token = getToken();
      const res = await base44.functions.invoke("entityProxy", {
        token, action: "filter", entity: entityName, filter: filterObj, sort, limit
      });
      handleExpired(res);
      return res.data.result;
    },
    async create(data) {
      const token = getToken();
      const res = await base44.functions.invoke("entityProxy", {
        token, action: "create", entity: entityName, data
      });
      handleExpired(res);
      return res.data.result;
    },
    async update(id, data) {
      const token = getToken();
      const res = await base44.functions.invoke("entityProxy", {
        token, action: "update", entity: entityName, id, data
      });
      handleExpired(res);
      return res.data.result;
    },
    async delete(id) {
      const token = getToken();
      const res = await base44.functions.invoke("entityProxy", {
        token, action: "delete", entity: entityName, id
      });
      handleExpired(res);
      return res.data.success || res.data.result;
    }
  };
}