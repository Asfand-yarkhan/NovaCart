const multer = require('multer');

const notFound = (req, res) => {
    res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
};

// Turns Mongoose, Multer and JWT errors into plain-language JSON responses.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let status = err.status || err.statusCode || 500;
    let message = err.message || 'Something went wrong on our side.';
    let fields;

    if (err.name === 'ValidationError') {
        status = 400;
        fields = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
        message = Object.values(fields)[0] || 'Some fields are invalid.';
    } else if (err.name === 'CastError') {
        status = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    } else if (err.code === 11000) {
        status = 409;
        const key = Object.keys(err.keyValue || {})[0] || 'field';
        message = `That ${key} is already in use.`;
        fields = { [key]: message };
    } else if (err instanceof multer.MulterError) {
        status = 400;
        message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : err.message;
    } else if (err.type === 'entity.parse.failed') {
        status = 400;
        message = 'Request body is not valid JSON.';
    }

    if (status >= 500) console.error(err);
    res.status(status).json({ message, ...(fields && { fields }) });
};

// Small helper for throwing HTTP errors from controllers.
const httpError = (status, message) => Object.assign(new Error(message), { status });

module.exports = { notFound, errorHandler, httpError };
