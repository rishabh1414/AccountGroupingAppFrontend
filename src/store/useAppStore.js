// src/store/useAppStore.js
import { create } from "zustand";
import api from "../api/api";

/* ---------------------------------------------
   CONSTANTS / HELPERS
---------------------------------------------- */
const CUSTOM_VALUE_FIELDS = [
  "agencyColor1",
  "agencyColor2",
  "agencyDarkLogo",
  "agencyLightLogo",
  "agencyName",
  "agencyPhoneNumber",
  "agencySupportEmail",
  "appTheme",
];

const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
};
const upsertById = (list = [], doc) => {
  const idx = list.findIndex((x) => String(x._id) === String(doc._id));
  if (idx === -1) return [doc, ...list];
  const next = list.slice();
  next[idx] = { ...next[idx], ...doc };
  return next;
};
const removeById = (list = [], id) =>
  list.filter((x) => String(x._id) !== String(id));
const clone = (x) => JSON.parse(JSON.stringify(x || {}));

/* ---------------------------------------------
   STORE
---------------------------------------------- */
const useAppStore = create((set, get) => ({
  parents: [],
  children: [],
  auditLogs: [],
  loading: false,
  error: null,

  token: localStorage.getItem("token") || null,
  user: null,
  isAuthenticated: !!localStorage.getItem("token"),

  childDataForConfirmation: null,

  // scheduler state
  activeSchedule: null,
  countdown: {
    enabled: false,
    seconds: 0,
    mode: null,
    parentId: null,
    nextRunAt: null,
  },
  countdowns: {},

  /* ---------- AUTH ---------- */
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const payload = credentials.username
        ? {
            username: credentials.username.trim(),
            password: credentials.password,
          }
        : { email: credentials.email?.trim(), password: credentials.password };

      const res = await api.post("/auth/login", payload);
      const body = res?.data || {};
      const token = body.token || body.data?.token;
      const user = body.user || body.data?.user;
      if (!token) throw new Error("Token missing in response");

      setAuthToken(token);
      set({ token, user, isAuthenticated: true, loading: false, error: null });
      return { token, user };
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 401
          ? "Invalid username/email or password."
          : "Login failed.");
      set({ error: message, loading: false, isAuthenticated: false });
      throw new Error(message);
    }
  }, // 2) Add inside create((set,get)=>({ ... }))
  updateParentCustomValues: async (parentId, updates) => {
    await api.patch(`/custom-values/parent/${parentId}?by=id`, { updates });
    await get().fetchParents();
  },

  updateChildCustomValues: async (childId, updates) => {
    await api.patch(`/custom-values/child/${childId}?by=id`, { updates });
    await get().fetchParents();
  },

  logout: () => {
    setAuthToken(null);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      childDataForConfirmation: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setAuthToken(token);
    try {
      const res = await api.get("/auth/me");
      const me = res?.data?.data?.user || res?.data?.user;
      if (me) set({ user: me, isAuthenticated: true });
    } catch {
      setAuthToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  updatePassword: async (passwordData) => {
    set({ loading: true });
    try {
      const res = await api.patch("/auth/update-password", passwordData);
      const { token } = res.data;
      localStorage.setItem("token", token);
      setAuthToken(token);
      set({ token, loading: false, error: null });
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update password.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  /* ---------- PARENTS / CHILDREN (unchanged) ---------- */
  fetchParents: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/techbizceos");
      set({ parents: res.data, loading: false });
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to fetch parents.";
      set({ error: msg, loading: false });
    }
  },

  searchGhlLocations: async (query) => {
    try {
      const res = await api.get(
        `/ghl-locations?search=${encodeURIComponent(query)}`
      );
      return res.data;
    } catch (error) {
      console.error("Failed to search GHL locations:", error);
      return [];
    }
  },

  addParent: async (parentData) => {
    set({ loading: true });
    try {
      const res = await api.post("/techbizceos", parentData);
      set((st) => ({
        parents: upsertById(st.parents, res.data),
        loading: false,
      }));
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add parent.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  updateParent: async (parentId, data) => {
    set({ loading: true });
    try {
      const res = await api.put(`/techbizceos/${parentId}`, data);
      set((st) => ({
        parents: upsertById(st.parents, res.data),
        loading: false,
      }));
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update parent.";
      set({ error: msg, loading: false });
      throw error;
    }
  },

  deleteParent: async (parentId) => {
    set({ loading: true });
    try {
      await api.delete(`/techbizceos/${parentId}`);
      set((st) => ({
        parents: removeById(st.parents, parentId),
        loading: false,
      }));
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete parent.";
      throw new Error(msg);
    }
  },

  fetchChildren: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/childaccounts");
      set({ children: res.data, loading: false });
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to fetch children.";
      set({ error: msg, loading: false });
    }
  },

  addChild: async (childData) => {
    set({ loading: true });
    try {
      const sanitized = {
        name: (childData.name || "").trim(),
        locationId: (childData.locationId || "").trim(),
        alias: (childData.alias || "").trim(),
        parentId: childData.parentId,
      };
      if (!sanitized.name || !sanitized.locationId || !sanitized.parentId) {
        throw new Error("Name, Location ID, and Parent ID are all required.");
      }
      const res = await api.post("/childaccounts", sanitized);
      set((st) => {
        const parents = clone(st.parents);
        const p = parents.find(
          (x) => String(x._id) === String(sanitized.parentId)
        );
        if (p) p.children = upsertById(p.children || [], res.data);
        const children = upsertById(st.children || [], res.data);
        return {
          parents,
          children,
          loading: false,
          childDataForConfirmation: null,
        };
      });
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add child.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  checkAndAddChild: async (childData) => {
    const { parents } = get();
    const parent = parents.find((p) => p._id === childData.parentId);
    if (!parent) throw new Error("Selected parent could not be found.");
    const missingKeys = CUSTOM_VALUE_FIELDS.filter(
      (key) =>
        !parent.customValues?.hasOwnProperty(key) ||
        !parent.customValues[key]?.id
    );
    if (missingKeys.length === 0) {
      await get().addChild(childData);
      return { status: "success" };
    } else {
      set({ childDataForConfirmation: childData });
      return { status: "needs_sync", missing: missingKeys };
    }
  },

  syncParentAndAddChild: async () => {
    const { childDataForConfirmation } = get();
    if (!childDataForConfirmation) return;
    try {
      await get().syncParentFromGhl(childDataForConfirmation.parentId);
      await get().addChild(childDataForConfirmation);
    } catch (error) {
      console.error("Failed to sync parent and add child:", error);
      set({
        error: "Failed to sync parent before adding child. Please try again.",
      });
    } finally {
      set({ childDataForConfirmation: null });
    }
  },

  cancelAddChild: () => set({ childDataForConfirmation: null }),

  updateChild: async (childId, childData) => {
    set({ loading: true });
    try {
      const sanitized = {
        alias: (childData.alias || "").trim(),
        parentId: childData.parentId,
      };
      if (!sanitized.parentId)
        throw new Error("Parent Account is required for an update.");

      const res = await api.put(`/childaccounts/${childId}`, sanitized);
      set((st) => {
        const parents = clone(st.parents);
        for (const p of parents) {
          if (Array.isArray(p.children)) {
            const idx = p.children.findIndex(
              (c) => String(c._id) === String(childId)
            );
            if (idx !== -1) {
              p.children[idx] = { ...p.children[idx], ...res.data };
              break;
            }
          }
        }
        const children = upsertById(st.children || [], res.data);
        return { parents, children, loading: false };
      });
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update child.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  deleteChild: async (childId) => {
    set({ loading: true });
    try {
      await api.delete(`/childaccounts/${childId}`);
      set((st) => {
        const parents = clone(st.parents);
        for (const p of parents) {
          p.children = (p.children || []).filter(
            (c) => String(c._id) !== String(childId)
          );
        }
        const children = removeById(st.children || [], childId);
        return { parents, children, loading: false };
      });
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete child.";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  fetchAuditLogs: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/auditlogs");
      set({ auditLogs: res.data, loading: false });
    } catch (error) {
      const msg =
        error.response?.data?.message || "Failed to fetch audit logs.";
      set({ error: msg, loading: false });
    }
  },

  /* ---------- SYNC (manual, unchanged) ---------- */
  syncParent: async (parentId) => {
    try {
      const res = await api.post(`/techbizceos/${parentId}/sync`);
      await get().fetchParents();
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to sync parent.";
      throw new Error(msg);
    }
  },
  syncAll: async () => {
    try {
      const res = await api.post("/manual-sync-ghl-custom-values");
      await get().fetchParents();
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.message || "Global sync failed.";
      throw new Error(msg);
    }
  },
  syncParentFromGhl: async (parentId) => {
    try {
      const res = await api.post(`/techbizceos/${parentId}/sync-from-ghl`);
      await get().fetchParents();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Sync failed.";
      console.error("Failed to sync parent from GHL:", err);
      throw new Error(msg);
    }
  },
  globalSyncFromGhl: async () => {
    try {
      const res = await api.post(`/techbizceos/sync-from-ghl`);
      await get().fetchParents();
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Global sync failed.";
      console.error("Failed to perform global sync from GHL:", err);
      throw new Error(msg);
    }
  },

  /* ---------- SCHEDULER with INSTANT UI ---------- */
  enableGlobalSchedule: async (preset) => {
    // optimistic hide parent toggles immediately
    set((st) => {
      const next = { ...st.countdowns };
      Object.keys(next).forEach((k) => {
        if (k.startsWith("parent:")) delete next[k];
      });
      // provisional entry so UI hides parent buttons instantly
      next.global = {
        scope: "global",
        enabled: true,
        seconds: null,
        nextRunAt: null,
      };
      return { countdowns: next };
    });

    const res = await api.put("/schedule/global", preset);
    // ⬇️ use returned countdown so we have seconds NOW
    const cd = res?.data?.countdown;
    if (cd) {
      set((st) => ({ countdowns: { ...st.countdowns, global: cd } }));
    } else {
      await get().refreshCountdownForGlobal();
    }
    await get().deriveActiveFromSoonest();
  },

  enableParentSchedule: async (parentId, preset) => {
    // optimistic: remove global only; keep other parents
    set((st) => {
      const next = { ...st.countdowns };
      delete next.global;
      next[`parent:${parentId}`] = {
        scope: "parent",
        parentId,
        enabled: true,
        seconds: null,
        nextRunAt: null,
      };
      return { countdowns: next };
    });

    const res = await api.put(`/schedule/parent/${parentId}`, preset);
    const cd = res?.data?.countdown;
    if (cd) {
      set((st) => ({
        countdowns: { ...st.countdowns, [`parent:${parentId}`]: cd },
      }));
    } else {
      await get().refreshCountdownForParent(parentId);
    }
    await get().deriveActiveFromSoonest();
  },

  disableSchedule: async (scopeBody) => {
    await api.post("/schedule/disable", scopeBody || {});
    // optimistic clear
    set((st) => {
      const next = { ...st.countdowns };
      if (!scopeBody || scopeBody.scope === "global") {
        delete next.global;
      } else if (scopeBody.scope === "parent" && scopeBody.parentId) {
        delete next[`parent:${scopeBody.parentId}`];
      } else {
        for (const k of Object.keys(next)) delete next[k];
      }
      return {
        countdowns: next,
        countdown: {
          enabled: false,
          seconds: 0,
          mode: null,
          parentId: null,
          nextRunAt: null,
        },
      };
    });
    // confirm with server (ensures DB truly empty so UI doesn't pop back)
    await get().refreshCountdownAll();
    await get().deriveActiveFromSoonest();
  },

  runScheduleNow: async () => {
    try {
      await api.post("/schedule/run");
    } catch {}
  },

  refreshCountdownForGlobal: async () => {
    const { data } = await api.get("/schedule/countdown", {
      params: { scope: "global" },
    });
    set((st) => ({ countdowns: { ...st.countdowns, global: data } }));
    await get().maybeSetCompatCountdownFromMap();
    return data;
  },
  refreshCountdownForParent: async (parentId) => {
    const { data } = await api.get("/schedule/countdown", {
      params: { scope: "parent", parentId },
    });
    set((st) => ({
      countdowns: { ...st.countdowns, [`parent:${parentId}`]: data },
    }));
    await get().maybeSetCompatCountdownFromMap();
    return data;
  },
  refreshCountdownAll: async () => {
    const { data } = await api.get("/schedule/countdown");
    const map = {};
    (Array.isArray(data) ? data : []).forEach((c) => {
      if (c.scope === "global") map["global"] = c;
      else if (c.scope === "parent" && c.parentId)
        map[`parent:${c.parentId}`] = c;
    });
    set({ countdowns: map });
    await get().maybeSetCompatCountdownFromMap();
    return map;
  },
  getActiveSchedule: async () => {
    await get().refreshCountdownAll();
    return await get().deriveActiveFromSoonest();
  },
  maybeSetCompatCountdownFromMap: async () => {
    const map = get().countdowns || {};
    const vals = Object.values(map).filter(
      (v) => v?.enabled && typeof v.seconds === "number"
    );
    if (!vals.length) {
      set({
        countdown: {
          enabled: false,
          seconds: 0,
          mode: null,
          parentId: null,
          nextRunAt: null,
        },
      });
      return null;
    }
    vals.sort((a, b) => (a?.seconds ?? 1e15) - (b?.seconds ?? 1e15));
    const best = vals[0];
    set({
      countdown: {
        enabled: true,
        seconds: best.seconds ?? 0,
        mode: best.scope === "global" ? "global" : "parent",
        parentId: best.parentId || null,
        nextRunAt: best.nextRunAt || null,
      },
    });
    return best;
  },
  deriveActiveFromSoonest: async () => {
    const best = await get().maybeSetCompatCountdownFromMap();
    if (!best) {
      set({ activeSchedule: null });
      return null;
    }
    const active = {
      enabled: true,
      mode: best.scope === "global" ? "global" : "parent",
      parentId: best.parentId || null,
      nextRunAt: best.nextRunAt || null,
    };
    set({ activeSchedule: active });
    return active;
  },
}));

useAppStore.getState().checkAuth();
export default useAppStore;
