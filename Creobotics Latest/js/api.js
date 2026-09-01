// js/api.js - MySQL Backend API Client
console.log('✅ api.js loading...');

const API_URL = 'http://localhost:5000/api';

// Token management
let authToken = null;

export function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('creo_token', token);
        console.log('🔑 Token saved');
    } else {
        localStorage.removeItem('creo_token');
        console.log('🔑 Token cleared');
    }
}

export function getAuthToken() {
    if (!authToken) {
        authToken = localStorage.getItem('creo_token');
    }
    return authToken;
}

// API helper
async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${API_URL}${endpoint}`;
    console.log(`📡 API Call: ${options.method || 'GET'} ${url}`);
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('❌ API Error:', data);
            throw new Error(data.error || 'Request failed');
        }
        
        console.log('✅ API Success:', endpoint);
        return data;
    } catch (error) {
        console.error('❌ API Call Failed:', error.message);
        throw error;
    }
}

// ===== AUTH =====

export async function registerUser(name, email, school, password, role) {
    console.log('📝 Registering user:', email);
    const result = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, school, password, role })
    });
    console.log('✅ Registration successful:', result);
    return result;
}

export async function loginUser(email, password, role) {
    console.log('🔐 Logging in:', email);
    try {
        const result = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, role })
        });
        
        if (result.token) {
            setAuthToken(result.token);
            console.log('✅ Login successful, token saved');
            return { success: true, user: result.user };
        }
        return { success: false, error: 'No token received' };
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return { success: false, error: error.message };
    }
}

export async function getCurrentUser() {
    console.log('👤 Getting current user...');
    try {
        const user = await apiCall('/auth/me');
        console.log('✅ Current user:', user);
        return user;
    } catch (error) {
        console.error('❌ Get user error:', error.message);
        return null;
    }
}

export async function logoutUser() {
    console.log('🚪 Logging out...');
    setAuthToken(null);
    localStorage.removeItem('creo_token');
    console.log('✅ Logged out');
}

export async function updateProfile(name, school) {
    console.log('📝 Updating profile...');
    const result = await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, school })
    });
    console.log('✅ Profile updated');
    return result;
}

export async function updateAvatar(avatarId, nickname) {
    console.log('📝 Updating avatar:', avatarId);
    const result = await apiCall('/auth/avatar', {
        method: 'PUT',
        body: JSON.stringify({ avatarId, nickname })
    });
    console.log('✅ Avatar updated');
    return result;
}

export async function changePassword(currentPassword, newPassword) {
    console.log('🔐 Changing password...');
    const result = await apiCall('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
    });
    console.log('✅ Password changed');
    return result;
}

// ===== ADMIN =====

export async function makeAdmin(code) {
    console.log('🔑 Making user admin...');
    const result = await apiCall('/auth/make-admin', {
        method: 'POST',
        body: JSON.stringify({ code })
    });
    console.log('✅ Admin access granted');
    return result;
}

// ===== PROGRESS =====

export async function getProgress() {
    console.log('📊 Getting progress...');
    try {
        const progress = await apiCall('/progress');
        console.log('✅ Progress loaded');
        return progress;
    } catch (error) {
        console.error('❌ Get progress error:', error.message);
        return { completed: {}, highest: {}, history: {} };
    }
}

export async function saveProgress(progress) {
    console.log('📊 Saving progress...');
    const result = await apiCall('/progress', {
        method: 'POST',
        body: JSON.stringify(progress)
    });
    console.log('✅ Progress saved');
    return result;
}

// ===== MODULES =====

export async function getCustomModules() {
    console.log('📚 Getting custom modules...');
    try {
        const result = await apiCall('/modules');
        console.log('✅ Custom modules loaded:', result.custom?.length || 0);
        return result.custom || [];
    } catch (error) {
        console.error('❌ Get modules error:', error.message);
        return [];
    }
}

export async function addCustomModule(moduleData) {
    console.log('📝 Adding custom module...');
    const result = await apiCall('/admin/modules', {
        method: 'POST',
        body: JSON.stringify(moduleData)
    });
    console.log('✅ Module added');
    return result.module;
}

export async function deleteCustomModule(moduleId) {
    console.log('🗑️ Deleting module:', moduleId);
    const result = await apiCall(`/admin/modules/${moduleId}`, {
        method: 'DELETE'
    });
    console.log('✅ Module deleted');
    return result;
}

// ===== SERIAL KEYS =====

export async function getSerialKeys() {
    console.log('🔑 Getting serial keys...');
    try {
        const keys = await apiCall('/admin/serial-keys');
        console.log('✅ Serial keys loaded:', keys.length || 0);
        return keys;
    } catch (error) {
        console.error('❌ Get serial keys error:', error.message);
        return [];
    }
}

export async function generateSerialKeys(count, grade = 4) {
    console.log('🔑 Generating serial keys:', count);
    const result = await apiCall('/admin/serial-keys', {
        method: 'POST',
        body: JSON.stringify({ count, grade })
    });
    console.log('✅ Serial keys generated:', result.keys?.length || 0);
    return result.keys;
}

export async function redeemSerialKey(code) {
    console.log('🔑 Redeeming serial key...');
    const result = await apiCall('/serial/redeem', {
        method: 'POST',
        body: JSON.stringify({ code })
    });
    console.log('✅ Serial key redeemed');
    return result;
}

export async function getAccessStatus() {
    console.log('🔑 Getting access status...');
    try {
        const status = await apiCall('/access/status');
        console.log('✅ Access status:', status);
        return status;
    } catch (error) {
        console.error('❌ Get access status error:', error.message);
        return { hasAccess: false, expiresAt: null };
    }
}

// ===== TEACHER ROUTES =====

export async function getTeacherCodes() {
    console.log('👨‍🏫 Getting teacher codes...');
    try {
        const codes = await apiCall('/admin/teacher-codes');
        console.log('✅ Teacher codes loaded:', codes.length || 0);
        return codes;
    } catch (error) {
        console.error('❌ Get teacher codes error:', error.message);
        return [];
    }
}

export async function generateTeacherCodes(count) {
    console.log('👨‍🏫 Generating teacher codes:', count);
    const result = await apiCall('/admin/teacher-codes', {
        method: 'POST',
        body: JSON.stringify({ count })
    });
    console.log('✅ Teacher codes generated:', result.codes?.length || 0);
    return result.codes;
}

export async function redeemTeacherCode(code) {
    console.log('👨‍🏫 Redeeming teacher code...');
    const result = await apiCall('/teacher/redeem', {
        method: 'POST',
        body: JSON.stringify({ code })
    });
    console.log('✅ Teacher code redeemed');
    return result;
}

export async function generateClassCode() {
    console.log('👨‍🏫 Generating class code...');
    const result = await apiCall('/teacher/class-code', {
        method: 'POST'
    });
    console.log('✅ Class code generated:', result.classCode);
    return result.classCode;
}

export async function joinClass(classCode) {
    console.log('👨‍🏫 Joining class:', classCode);
    const result = await apiCall('/teacher/join-class', {
        method: 'POST',
        body: JSON.stringify({ classCode })
    });
    console.log('✅ Joined class');
    return result;
}

export async function leaveClass() {
    console.log('👨‍🏫 Leaving class...');
    const result = await apiCall('/teacher/leave-class', {
        method: 'POST'
    });
    console.log('✅ Left class');
    return result;
}

export async function getTeacherStudents() {
    console.log('👨‍🏫 Getting students...');
    try {
        const students = await apiCall('/teacher/students');
        console.log('✅ Students loaded:', students.length || 0);
        return students;
    } catch (error) {
        console.error('❌ Get students error:', error.message);
        return [];
    }
}

console.log('✅ api.js loaded successfully!');