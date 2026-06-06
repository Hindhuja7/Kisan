export interface FarmerUser {
  name: string;
  phone: string;
  village: string;
  district: string;
}

interface StoredUser extends FarmerUser {
  password: string;
}

const SESSION_KEY = "kisan-session";
const USERS_KEY = "kisan-users";

function loadUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession(): FarmerUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as FarmerUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: FarmerUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function signup(user: FarmerUser, password: string): { ok: true } | { ok: false; error: string } {
  const phone = user.phone.replace(/\s/g, "");
  if (!user.name.trim()) return { ok: false, error: "name" };
  if (phone.length < 10) return { ok: false, error: "phone" };
  if (password.length < 4) return { ok: false, error: "password" };

  const users = loadUsers();
  if (users.some((u) => u.phone === phone)) {
    return { ok: false, error: "exists" };
  }

  users.push({ ...user, phone, password });
  saveUsers(users);
  setSession({ ...user, phone });
  return { ok: true };
}

export function login(phone: string, password: string): { ok: true; user: FarmerUser } | { ok: false; error: string } {
  const normalized = phone.replace(/\s/g, "");
  const users = loadUsers();
  const found = users.find((u) => u.phone === normalized && u.password === password);
  if (!found) return { ok: false, error: "invalid" };
  const user: FarmerUser = {
    name: found.name,
    phone: found.phone,
    village: found.village,
    district: found.district,
  };
  setSession(user);
  return { ok: true, user };
}
