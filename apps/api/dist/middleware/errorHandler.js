"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    console.error('API Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Default error response
    const errorResponse = {
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
        code: 'INTERNAL_ERROR'
    };
    // Handle specific error types
    if (error.name === 'ValidationError') {
        errorResponse.error = 'Validation failed';
        errorResponse.code = 'VALIDATION_ERROR';
        res.status(400);
    }
    else if (error.name === 'CastError') {
        errorResponse.error = 'Invalid ID format';
        errorResponse.code = 'INVALID_ID';
        res.status(400);
    }
    else if (error.name === 'MongoError' && error.code === 11000) {
        errorResponse.error = 'Duplicate entry';
        errorResponse.code = 'DUPLICATE_ERROR';
        res.status(409);
    }
    else {
        res.status(500);
    }
    res.json(errorResponse);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map