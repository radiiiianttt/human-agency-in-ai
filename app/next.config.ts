import type { NextConfig } from 'next';
import path from 'node:path';
const config: NextConfig = { agentRules: false, turbopack: { root: path.resolve(process.cwd(), '..') } };
export default config;
