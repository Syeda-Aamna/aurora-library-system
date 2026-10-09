export const isPreviewDemoMode = () =>
  process.env.DEMO_MODE === 'true' &&
  !process.env.MONGODB_URI &&
  process.env.NODE_ENV !== 'production';
