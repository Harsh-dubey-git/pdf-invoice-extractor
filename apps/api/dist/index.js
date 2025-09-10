"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./utils/database");
const errorHandler_1 = require("./middleware/errorHandler");
const upload_1 = __importDefault(require("./routes/upload"));
const extract_1 = __importDefault(require("./routes/extract"));
const invoices_1 = __importDefault(require("./routes/invoices"));
// Load environment variables from local and monorepo root (fallbacks)
dotenv_1.default.config(); // apps/api/.env
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../..', '.env') }); // monorepo root .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') }); // fallback for tsx runtime pathing
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Flowbit API is running',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api/upload', upload_1.default);
app.use('/api/extract', extract_1.default);
app.use('/api/invoices', invoices_1.default);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
    });
});
// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.connectDB)();
        app.listen(PORT, () => {
            console.log(`🚀 Flowbit API server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map