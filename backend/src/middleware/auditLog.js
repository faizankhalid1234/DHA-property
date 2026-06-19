import AuditLog from '../models/AuditLog.js';

export const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400 && body?.success !== false) {
        AuditLog.create({
          user: req.user?._id,
          userName: req.user?.name || 'System',
          action,
          resource,
          resourceId: body?.data?._id || req.params.id,
          details: { method: req.method, path: req.originalUrl, body: req.body },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || '',
        }).catch(console.error);
      }
      return originalJson(body);
    };
    next();
  };
};
