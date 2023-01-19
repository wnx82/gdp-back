const catchAsync = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
    };



module.exports = catchAsync;



// const catchAsync = (fn) => {
//     return (req, res, next) => {
//         Promise
//             .resolve(fn(req, res, next))
//             .catch((err) => next(err));
//     };
// };

// module.exports = catchAsync;