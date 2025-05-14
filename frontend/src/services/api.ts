// src/services/api.ts

export const BACKEND_URL = "http://172.20.10.11:3000"; // 🔁 Update this as needed

// ========== Utility POST method ==========
async function post(endpoint: string, body: any) {
  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`📡 POST ${url}`);
  console.log(`📤 Body:`, body);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text(); // Get raw response first
    console.log(`🧾 Raw response from ${url}:\n`, text); // <-- Add this line!

    let result;
    try {
      result = JSON.parse(text); // Try parse JSON
    } catch (err) {
      console.error(`❌ Failed to parse JSON from ${url}:\n`, text);
      throw new Error("Invalid response from server. Expected JSON.");
    }

    if (!res.ok) {
  console.error(`❌ Server responded with status ${res.status}`);
  console.error("🪵 Server error body:", result);
  throw new Error(result.error || result.message || "Server responded with error");
}

    return result;
  } catch (err: any) {
    console.error(`❌ POST ${url} failed:`, err.message);
    throw err;
  }
}



// ========== User & Auth API Methods ==========

// ----- Coach -----
export const registerCoachStep1 = async (email: string) => {
  return await post("/api/user/registerCoachStep1", { email });
};

export const registerCoach = async (data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  age: string;
  gender: string;
  sport: string;
  qualifications: string;
}) => {
  return await post("/api/user/signup-coach", data);
};

// ----- Student -----
export const registerStudentStep1 = async (email: string) => {
  return await post("/api/user/registerStudentStep1", { email });
};

export const registerStudent = async (data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  age: string;
  gender: string;
  level_of_expertise: string;
  qualifications?: string;
}) => {
  return await post("/api/user/signup-Student", data);
};

// ----- Login -----
export const login = async (email: string, password: string) => {
  return await post("/api/user/login", { email, password });
};
