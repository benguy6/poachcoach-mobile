import axios from 'axios';
export const BACKEND_URL = "http://192.168.88.13:3000"; // Update as needed

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

export const getCoachDashboard = async (token: string) => {
  const res = await fetch(`${BACKEND_URL}/api/coach/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getStudentDashboard = async (token: string) => {
  const res = await fetch(`${BACKEND_URL}/api/student/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getUserRole = async (token: string | undefined) => {
  console.log('getUserRole called with token:', token ? 'present' : 'missing');
  if (!token) throw new Error('No access token provided');
  
  const url = `${BACKEND_URL}/api/user/me`;
  console.log('getUserRole - Making request to:', url);
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  console.log('getUserRole - Response status:', res.status);
  console.log('getUserRole - Response ok:', res.ok);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.log('getUserRole - Error response:', errorText);
    throw new Error('Failed to fetch user role');
  }
  
  const data = await res.json();
  console.log('getUserRole - Success response:', data);
  return data;
};

export const createCoachSession = async (token: string, sessionData: any) => {
  const res = await fetch(`${BACKEND_URL}/api/coach/session/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(sessionData),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
};

import { getToken } from './auth';

export const uploadProfilePicture = async (uri: string) => {
  const token = await getToken();
  if (!token) throw new Error('No token found');

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'profile.jpg',
    type: 'image/jpeg', // or 'image/png' if needed
  } as any);

  const res = await fetch(`${BACKEND_URL}/api/uploadProfilePicture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // DO NOT set Content-Type here!
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to upload');
  }
  const data = await res.json();
  return data.url; // The new image URL
};

export const getStudentProfile = async (token: string) => {
  const url = `${BACKEND_URL}/api/student/profile`;
  console.log(`GET ${url}`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch student profile:`, errorText);
    throw new Error(errorText || "Failed to fetch student profile");
  }

  const data = await res.json();
  console.log(`Student profile fetched successfully:`, data);
  return data;
};
export const getCoachProfile = async (token: string) => {
  const url = `${BACKEND_URL}/api/coach/profile`;
  console.log(`GET ${url}`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch coach profile:`, errorText);
    throw new Error(errorText || "Failed to fetch coach profile");
  }

  const data = await res.json();
  console.log(`Coach profile fetched successfully:`, data);
  return data;
};





