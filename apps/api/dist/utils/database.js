"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowbit';
        console.log('Connecting to MongoDB:', mongoUri);
        // Enforce real connection; fail fast if not reachable
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB successfully');
        // Handle connection events
        mongoose_1.default.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        // Re-throw to stop the server if DB is required
        throw error;
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
    catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
        throw error;
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map