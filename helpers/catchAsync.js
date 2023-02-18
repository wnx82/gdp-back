//version 3
const catchAsync = handler => (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

module.exports = catchAsync;

//version 2

// const catchAsync = fn => (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch(err => next(err));
// };

// module.exports = catchAsync;

//version 1

// const catchAsync = (fn) => {
//     return (req, res, next) => {
//         Promise
//             .resolve(fn(req, res, next))
//             .catch((err) => next(err));
//     };
// };

// module.exports = catchAsync;
