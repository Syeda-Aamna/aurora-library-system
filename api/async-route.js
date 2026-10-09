// Express 4 does not forward rejected async route promises without an explicit wrapper.
export default function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
