// The icons listed in /site.webmanifest, written to dist/icons/. See src/lib/icon.ts.
import type { APIRoute, GetStaticPaths } from 'astro';
import { iconPng, manifestIcons } from '../../lib/icon';

export const getStaticPaths = (() =>
  Object.keys(manifestIcons).map((name) => ({ params: { name } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => iconPng(manifestIcons[params.name as string]);
