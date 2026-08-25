import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { createClient } from "@supabase/supabase-js";
//#region src/pages/api/users.ts
var users_exports = /* @__PURE__ */ __exportAll({
	DELETE: () => DELETE,
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var supabaseUrl = "https://juvigbxkimzchgnznoie.supabase.co";
var anonKey = "sb_publishable_K44kgnlVPHf4dle40gIG_A_Lty-VnLq";
var serviceKey = "YOUR_SERVICE_ROLE_KEY_HERE";
function adminClient() {
	return createClient(supabaseUrl, serviceKey);
}
async function verifyUser(request) {
	const auth = request.headers.get("Authorization");
	if (!auth?.startsWith("Bearer ")) return null;
	const token = auth.slice(7);
	const { data: { user }, error } = await createClient(supabaseUrl, anonKey).auth.getUser(token);
	if (error || !user) return null;
	return user;
}
var GET = async ({ request }) => {
	if (!await verifyUser(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
	try {
		const { data, error } = await adminClient().auth.admin.listUsers({ perPage: 100 });
		if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
		return new Response(JSON.stringify(data.users), { status: 200 });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
};
var POST = async ({ request }) => {
	if (!await verifyUser(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
	try {
		const { email, password } = await request.json();
		if (!email || !password) return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });
		const { data, error } = await adminClient().auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});
		if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
		return new Response(JSON.stringify(data.user), { status: 200 });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
};
var DELETE = async ({ request }) => {
	if (!await verifyUser(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
	try {
		const { id } = await request.json();
		if (!id) return new Response(JSON.stringify({ error: "User ID required" }), { status: 400 });
		const { error } = await adminClient().auth.admin.deleteUser(id);
		if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
		return new Response(JSON.stringify({ ok: true }), { status: 200 });
	} catch (e) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/users@_@ts
var page = () => users_exports;
//#endregion
export { page };
