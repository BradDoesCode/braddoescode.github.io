// The iOS home-screen icon: 180 by 180, opaque, no rounded corners.
// See src/lib/icon.ts.
import type { APIRoute } from 'astro';
import { iconPng, LETTER } from '../lib/icon';

export const GET: APIRoute = () => iconPng({ size: 180, letter: LETTER.plain });
