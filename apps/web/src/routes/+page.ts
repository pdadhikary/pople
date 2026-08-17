import { redirect } from '@sveltejs/kit';

export const load = (): never => {
    throw redirect(302, '/jobs');
};
