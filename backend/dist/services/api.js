"use strict";
// src/services/api.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.registerStudent = exports.registerStudentStep1 = exports.registerCoach = exports.registerCoachStep1 = exports.BACKEND_URL = void 0;
exports.BACKEND_URL = "http://192.168.88.10:3000"; // 🔁 Update this as needed
// ========== Utility POST method ==========
function post(endpoint, body) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${exports.BACKEND_URL}${endpoint}`;
        console.log(`\u{1F4F1} POST ${url}`);
        try {
            const res = yield fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            const text = yield res.text(); // Get raw response first
            let result;
            try {
                result = JSON.parse(text); // Try parse JSON
            }
            catch (err) {
                console.error(`\u274C Failed to parse JSON from ${url}:\n`, text);
                throw new Error("Invalid response from server. Expected JSON.");
            }
            if (!res.ok) {
                throw new Error(result.message || "Server responded with error");
            }
            return result;
        }
        catch (err) {
            console.error(`\u274C POST ${url} failed:`, err.message);
            throw err;
        }
    });
}
// ========== User & Auth API Methods ==========
// ----- Coach -----
const registerCoachStep1 = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield post("/api/user/registerCoachStep1", { email });
});
exports.registerCoachStep1 = registerCoachStep1;
const registerCoach = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield post("/api/user/registerCoach", data);
});
exports.registerCoach = registerCoach;
// ----- Student -----
const registerStudentStep1 = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield post("/api/user/registerStudentStep1", { email });
});
exports.registerStudentStep1 = registerStudentStep1;
const registerStudent = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield post("/api/user/registerStudent", data);
});
exports.registerStudent = registerStudent;
// ----- Login -----
const login = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    return yield post("/api/user/login", { email, password });
});
exports.login = login;
//# sourceMappingURL=api.js.map