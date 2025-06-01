export const BACKEND_URL = "http://192.168.1.213:3000"; // Update as needed

async function post(endpoint: string, body: any) {
  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`POST ${url}`);
  console.log(`Body:`, body);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log(`Raw response from ${url}:\n`, text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (err) {
      console.error(` Failed to parse JSON from ${url}:\n`, text);
      throw new Error("Invalid response from server. Expected JSON.");
    }

    if (!res.ok) {
      console.error(` Server responded with status ${res.status}`);
      console.error("Server error body:", result);
      throw new Error(result.error || result.message || "Server responded with error");
    }

    return result;
  } catch (err: any) {
    console.error(` POST ${url} failed:`, err.message);
    throw err;
  }
}

export const registerCoachStep1 = async (
  email: string,
  password: string,
  confirm_password: string
) => {
  return await post("/api/user/registerCoachStep1", {
    email,
    password,
    confirm_password,
  });
};


export const registerCoach = async (data: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  age: string;
  gender: string;
  sport: string;
  qualifications: string;
  number: string;
  postal_code: string;
}) => {
  return await post("/api/user/signup-coach", data);
};

export const registerStudentStep1 = async (
  email: string,
  password: string,
  confirm_password: string
) => {
  return await post("/api/user/registerStudentStep1", {
    email,
    password,
    confirm_password,
  });
};

export const registerStudent = async (data: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  age: string;
  gender: string;
  number: string;
  postal_code: string;
}) => {
  return await post("/api/user/signup-student", data);
};


export const login = async (email: string, password: string) => {
  return await post("/api/user/login", { email, password });
};


export const checkEmailExists = async (email: string) => {
  return await post("/api/user/request-reset-password", { email });
};



