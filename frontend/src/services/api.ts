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

export const getStudentSessions = async (token: string) => {
  const url = `${BACKEND_URL}/api/student/calendar/sessions`;
  console.log(`GET ${url}`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch student sessions:`, errorText);
    throw new Error(errorText || "Failed to fetch student sessions");
  }

  const data = await res.json();
  console.log(`Student sessions fetched successfully:`, data);
  return data;
};

// Coach Calendar API Functions
export const getCoachSessions = async (token: string) => {
  const url = `${BACKEND_URL}/api/coach/calendar/sessions`;
  console.log(`GET ${url}`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch coach sessions:`, errorText);
    throw new Error(errorText || "Failed to fetch coach sessions");
  }

  const data = await res.json();
  console.log(`Coach sessions fetched successfully:`, data);
  return data;
};

export const cancelCoachSession = async (token: string, uniqueId: string) => {
  const url = `${BACKEND_URL}/api/coach/calendar/cancel-session`;
  console.log(`POST ${url}`);

  const body = {
    uniqueId: uniqueId
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to cancel coach session:`, errorText);
    throw new Error(errorText || 'Failed to cancel coach session');
  }

  const data = await res.json();
  console.log(`Coach session cancelled successfully:`, data);
  return data;
};

export const rescheduleCoachSession = async (token: string, rescheduleData: {
  uniqueId: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  newPricePerSession: string;
  newAddress?: string;
  newPostalCode?: string;
}) => {
  const url = `${BACKEND_URL}/api/coach/calendar/reschedule-session`;
  console.log(`POST ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rescheduleData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to reschedule coach session:`, errorText);
    throw new Error(errorText || 'Failed to reschedule coach session');
  }

  const data = await res.json();
  console.log(`Coach session rescheduled successfully:`, data);
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

export const createCoachSession = async (token: string, sessionData: any) => {
  const url = `${BACKEND_URL}/api/coach/session/single-session`;
  console.log(`POST ${url}`);
  console.log(`Session Data:`, sessionData);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(sessionData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to create session:`, errorText);
    throw new Error(errorText || 'Failed to create session');
  }

  const data = await res.json();
  console.log(`Session created successfully:`, data);
  return data;
};

export const createRecurringCoachSession = async (token: string, sessionData: any) => {
  const url = `${BACKEND_URL}/api/coach/session/recurring-weekly`;
  console.log(`POST ${url}`);
  console.log(`Recurring Session Data:`, sessionData);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(sessionData),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to create recurring session:`, errorText);
    throw new Error(errorText || 'Failed to create recurring session');
  }
  
  const data = await response.json();
  console.log(`Recurring session created successfully:`, data);
  return data;
};

export const createMonthlyRecurringCoachSession = async (token: string, sessionData: any) => {
  const url = `${BACKEND_URL}/api/coach/session/recurring-monthly`;
  console.log(`POST ${url}`);
  console.log(`Monthly Recurring Session Data:`, sessionData);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(sessionData),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to create monthly recurring session:`, errorText);
    throw new Error(errorText || 'Failed to create monthly recurring session');
  }
  
  const data = await response.json();
  console.log(`Monthly recurring session created successfully:`, data);
  return data;
};

export const uploadQualificationsPDF = async (uri: string, fileName: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: 'application/pdf',
  } as any);

  const res = await fetch(`${BACKEND_URL}/api/uploadQualifications`, {
    method: 'POST',
    headers: {
      // Note: Don't set Content-Type for FormData, let browser set it
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to upload PDF');
  }
  
  const data = await res.json();
  return data.url; // Returns the PDF URL
};

export const saveQualifications = async (coachId: string, qualificationUrls: string[]) => {
  const url = `${BACKEND_URL}/api/uploadQualifications/save`;
  console.log(`POST ${url}`);
  console.log(`Body:`, { coach_id: coachId, qualifications: qualificationUrls });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coach_id: coachId,
      qualifications: qualificationUrls
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to save qualifications:`, errorText);
    throw new Error(errorText || 'Failed to save qualifications');
  }

  const data = await res.json();
  console.log(`Qualifications saved successfully:`, data);
  return data;
};

export const findCoaches = async (token: string) => {
  const url = `${BACKEND_URL}/api/find-coach/coaches`;
  console.log(`GET ${url}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch coaches:`, errorText);
    throw new Error(errorText || 'Failed to fetch coaches');
  }

  const data = await res.json();
  console.log(`Coaches fetched successfully:`, data);
  return data;
};

// Cancel a session (single or group class) for a student
export const cancelSession = async (token: string, sessionId: string, sessionDate: string) => {
  const url = `${BACKEND_URL}/api/student/dashboard/cancel-session`;
  console.log(`POST ${url}`);

  const body = {
    sessionId: sessionId,
    sessionDate: sessionDate
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to cancel session:`, errorText);
    throw new Error(errorText || 'Failed to cancel session');
  }

  const data = await res.json();
  console.log(`Session cancelled successfully:`, data);
  return data;
};

// Notification API functions
export const getNotifications = async (token: string) => {
  const url = `${BACKEND_URL}/api/notifications`;
  console.log(`GET ${url}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch notifications:`, errorText);
    throw new Error(errorText || 'Failed to fetch notifications');
  }

  const data = await res.json();
  console.log(`Notifications fetched successfully:`, data);
  return data;
};

export const getUnreadNotificationCount = async (token: string) => {
  const url = `${BACKEND_URL}/api/notifications/unread-count`;
  console.log(`GET ${url}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch unread count:`, errorText);
    throw new Error(errorText || 'Failed to fetch unread count');
  }

  const data = await res.json();
  console.log(`Unread count fetched successfully:`, data);
  return data;
};

export const markNotificationAsRead = async (token: string, notificationId: string) => {
  const url = `${BACKEND_URL}/api/notifications/${notificationId}/read`;
  console.log(`PUT ${url}`);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to mark notification as read:`, errorText);
    throw new Error(errorText || 'Failed to mark notification as read');
  }

  const data = await res.json();
  console.log(`Notification marked as read:`, data);
  return data;
};

export const markAllNotificationsAsRead = async (token: string) => {
  const url = `${BACKEND_URL}/api/notifications/mark-all-read`;
  console.log(`PUT ${url}`);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to mark all notifications as read:`, errorText);
    throw new Error(errorText || 'Failed to mark all notifications as read');
  }

  const data = await res.json();
  console.log(`All notifications marked as read:`, data);
  return data;
};

// Handle student response to session reschedule (accept/reject)
export const handleRescheduleResponse = async (token: string, sessionId: string, studentSessionId: string, response: 'accept' | 'reject') => {
  const url = `${BACKEND_URL}/api/coach/calendar/handle-reschedule-response`;
  console.log(`POST ${url}`);

  const body = {
    sessionId: sessionId,
    studentSessionId: studentSessionId, // Use studentSessionId instead of originalDate
    response: response
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to handle reschedule response:`, errorText);
    throw new Error(errorText || 'Failed to handle reschedule response');
  }

  const data = await res.json();
  console.log(`Reschedule response handled successfully:`, data);
  return data;
};








