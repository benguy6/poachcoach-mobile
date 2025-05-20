

const SUPABASE_URL = "https://ezdbjkcrtepdihmyunzm.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();
  return result;
}

export async function signUpWithEmail(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();
  return result;
}
