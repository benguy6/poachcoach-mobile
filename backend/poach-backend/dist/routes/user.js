"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../supabaseClient");
const authMiddleware_1 = require("../middleware/authMiddleware");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
const hashPassword = (password) => bcryptjs_1.default.hashSync(password, 10);
const checkPassword = (plain, hashed) => bcryptjs_1.default.compareSync(plain, hashed);
// Password validation
const isStrongPassword = (password) => {
    const upper = /[A-Z]/;
    const special = /[!@#$%^&*(),.?":{}|<>]/;
    return password.length >= 6 && upper.test(password) && special.test(password);
};
// Check email uniqueness
const isEmailTaken = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield supabaseClient_1.supabase
        .from('Users')
        .select('id')
        .eq('email', email)
        .limit(1);
    return !!(data === null || data === void 0 ? void 0 : data.length);
});
// Create Supabase Auth user
const createAuthUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    return yield supabaseClient_1.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });
});
// ===========================
// ✅ Step 1 Signup Routes
// ===========================
router.post('/registerStudentStep1', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    console.log("🔍 Checking student email:", email);
    if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
    }
    if (yield isEmailTaken(email)) {
        res.status(400).json({ error: 'Email already in use' });
        return;
    }
    res.status(200).json({ message: 'Email is available' });
}));
router.post('/registerCoachStep1', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    console.log("🔍 Checking coach email:", email);
    if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
    }
    if (yield isEmailTaken(email)) {
        res.status(400).json({ error: 'Email already in use' });
        return;
    }
    res.status(200).json({ message: 'Email is available' });
}));
// ===========================
// 🧑‍🏫 Coach Signup
// ===========================
router.post('/signup-coach', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password, first_name, last_name, age, gender, qualifications } = req.body;
    if (!email || !password || !first_name || !last_name || !age || !gender || !qualifications) {
        res.status(400).json({ error: 'All fields are required' });
        return;
    }
    if (!isStrongPassword(password)) {
        res.status(400).json({ error: 'Password must include uppercase letters and special characters' });
        return;
    }
    if (yield isEmailTaken(email)) {
        res.status(400).json({ error: 'Email already in use' });
        return;
    }
    const { data: authUser, error: authError } = yield createAuthUser(email, password);
    if (authError || !((_a = authUser === null || authUser === void 0 ? void 0 : authUser.user) === null || _a === void 0 ? void 0 : _a.id)) {
        res.status(400).json({ error: (authError === null || authError === void 0 ? void 0 : authError.message) || 'Auth creation failed' });
        return;
    }
    const userId = authUser.user.id;
    const hashedPassword = hashPassword(password);
    const { error: userErr } = yield supabaseClient_1.supabase.from('Users').insert([{
            id: userId,
            email,
            password: hashedPassword,
            first_name,
            last_name,
            age,
            gender,
            role: 'coach',
        }]);
    if (userErr) {
        yield supabaseClient_1.supabase.auth.admin.deleteUser(userId);
        res.status(500).json({ error: userErr.message });
        return;
    }
    const { error: coachErr } = yield supabaseClient_1.supabase.from('Coaches').insert([{
            id: userId,
            qualifications,
        }]);
    if (coachErr) {
        res.status(500).json({ error: coachErr.message });
        return;
    }
    res.status(201).json({ message: 'Coach registered successfully' });
}));
// ===========================
// 👩‍🎓 Student Signup
// ===========================
router.post('/signup-student', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password, first_name, last_name, age, gender, level_of_expertise } = req.body;
    if (!email || !password || !first_name || !last_name || !age || !gender || !level_of_expertise) {
        res.status(400).json({ error: 'All fields are required' });
        return;
    }
    if (!isStrongPassword(password)) {
        res.status(400).json({ error: 'Password must include uppercase letters and special characters' });
        return;
    }
    if (yield isEmailTaken(email)) {
        res.status(400).json({ error: 'Email already in use' });
        return;
    }
    const { data: authUser, error: authError } = yield createAuthUser(email, password);
    if (authError || !((_a = authUser === null || authUser === void 0 ? void 0 : authUser.user) === null || _a === void 0 ? void 0 : _a.id)) {
        res.status(400).json({ error: (authError === null || authError === void 0 ? void 0 : authError.message) || 'Auth creation failed' });
        return;
    }
    const userId = authUser.user.id;
    const hashedPassword = hashPassword(password);
    const { error: userErr } = yield supabaseClient_1.supabase.from('Users').insert([{
            id: userId,
            email,
            password: hashedPassword,
            first_name,
            last_name,
            age,
            gender,
            role: 'student',
        }]);
    if (userErr) {
        yield supabaseClient_1.supabase.auth.admin.deleteUser(userId);
        res.status(500).json({ error: userErr.message });
        return;
    }
    const { error: studentErr } = yield supabaseClient_1.supabase.from('Students').insert([{
            id: userId,
            level_of_expertise,
        }]);
    if (studentErr) {
        res.status(500).json({ error: studentErr.message });
        return;
    }
    res.status(201).json({ message: 'Student registered successfully' });
}));
// ===========================
// 🔐 Login
// ===========================
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    const { data: users, error } = yield supabaseClient_1.supabase
        .from('Users')
        .select('*')
        .eq('email', email)
        .limit(1);
    if (error || !users || users.length === 0) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
    }
    const user = users[0];
    const valid = checkPassword(password, user.password);
    if (!valid) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
    }
    res.status(200).json({
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        }
    });
}));
// ===========================
// 🔒 Protected route
// ===========================
router.get('/me', authMiddleware_1.verifySupabaseToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(400).json({ error: 'User ID missing from request' });
        return;
    }
    const { data: user, error: userError } = yield supabaseClient_1.supabase
        .from('Users')
        .select('*')
        .eq('id', userId)
        .single();
    if (userError || !user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const { data: coach } = yield supabaseClient_1.supabase
        .from('Coaches')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
    const { data: student } = yield supabaseClient_1.supabase
        .from('Students')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
    let role = 'unknown';
    if (coach)
        role = 'coach';
    else if (student)
        role = 'student';
    res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        role,
    });
}));
exports.default = router;
//# sourceMappingURL=user.js.map