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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySupabaseToken = void 0;
const supabaseClient_1 = require("../supabaseClient");
const verifySupabaseToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const { data, error } = yield supabaseClient_1.supabase.auth.getUser(token);
        if (error || !(data === null || data === void 0 ? void 0 : data.user)) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        // Attach user to request
        req.user = {
            id: data.user.id,
            email: data.user.email || '',
            username: ((_a = data.user.user_metadata) === null || _a === void 0 ? void 0 : _a.username) || '',
        };
        next();
    }
    catch (err) {
        console.error('Authentication error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
});
exports.verifySupabaseToken = verifySupabaseToken;
//# sourceMappingURL=authMiddleware.js.map