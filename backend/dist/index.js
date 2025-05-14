"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const user_1 = __importDefault(require("./routes/user"));
const sessions_1 = __importDefault(require("./routes/sessions"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)()); // You can pass options: { origin: "http://localhost:19006" } to restrict in dev
app.use(express_1.default.json());
// Routes
app.use('/api/user', user_1.default);
app.use('/api/sessions', sessions_1.default);
// Health check
app.get('/', (_req, res) => {
    res.send('✅ Server is running');
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map