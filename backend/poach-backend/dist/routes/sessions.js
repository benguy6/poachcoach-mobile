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
// src/routes/sessions.ts
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../supabaseClient");
const router = express_1.default.Router();
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return; // Ensure no further code executes after response
    }
    const { data, error } = yield supabaseClient_1.supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        res.status(401).json({ error: error.message });
        return;
    }
    res.status(200).json({
        access_token: (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token,
        user: {
            id: data.user.id,
            email: data.user.email,
        },
    });
}));
exports.default = router;
//# sourceMappingURL=sessions.js.map