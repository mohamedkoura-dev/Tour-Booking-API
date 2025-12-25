module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

/*

Express calls  →  (req, res, next) => { 
    fn(req, res, next).catch(next); 
}

Inside:
 ├─ fn(req, res, next) → runs your async handler → returns a Promise
 │
 ├─ If the Promise resolves → nothing happens → normal response
 │
 └─ If the Promise rejects → .catch(next) calls next(error)
                            ↓
                     Express global error handler

*/
