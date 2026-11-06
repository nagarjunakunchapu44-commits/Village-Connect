const errorMiddleware = (err, req, res, next) => {
    console.error("Server error:", err);

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error.",
        error:
            process.env.NODE_ENV === "development"
                ? err.stack
                : undefined
    });
};

module.exports = errorMiddleware;